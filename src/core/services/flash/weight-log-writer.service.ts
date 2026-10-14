/* eslint-disable prettier/prettier */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { WeightLog } from 'src/core/entities/flash/weight-log.entity';
import { StationSession } from 'src/core/entities/flash/station-session.entity';
import { Setting } from 'src/core/entities/setting/setting.entity';

/** Données minimales d'une pesée (un Flash enregistré, ou le payload d'un événement) */
export interface WeightInput {
  branch?: string;
  station?: string;
  sentWeight?: number | string | null;
  status?: string | null;
  reference?: string | null;
  ticket?: string | null;
  inputFromBc?: number | null;
  outputFromBc?: number | null;
  frame?: string | null;
  latency?: number | string | null;
  isMonitored?: boolean | null;
  timestamp?: number | string | null;
  computerName?: string | null;
  computerUser?: string | null;
  userName?: string | null;
  userProfile?: string | null;
  createdAt?: Date | string | null;
}

interface PendingRow {
  row: Partial<WeightLog>;
  sessionKey: string;
  sessionInfo: Pick<StationSession, 'branch' | 'station' | 'computerName' | 'computerUser' | 'userName' | 'userProfile'>;
}

interface DailyAgg {
  day: string;
  branch: string;
  station: string;
  frames: number;
  rows: number;
  weights: number;
  min: number | null;
  max: number | null;
  sum: number;
}

/**
 * Écriture du journal des pesées (ADR-0022).
 *
 * - Réception découplée de la base : `record()` ne fait qu'empiler en mémoire ;
 *   un seul INSERT groupé est envoyé toutes les FLUSH_INTERVAL_MS, ou dès BATCH_SIZE lignes.
 * - Dédoublonnage : une ligne n'est écrite que si le poids ou le statut change,
 *   ou si `audit_heartbeat_seconds` (30 s par défaut) se sont écoulées depuis la dernière.
 * - Toutes les trames, écrites ou non, alimentent le résumé journalier `weight_daily`.
 * - Les infos du poste (ordinateur, utilisateur, profil) vont dans `station_session`,
 *   une ligne par changement, référencée par `session_id`.
 * - File bornée à MAX_QUEUE lignes : si la base est indisponible trop longtemps,
 *   les plus anciennes sont abandonnées (avec un avertissement) plutôt que de saturer la mémoire.
 */
@Injectable()
export class WeightLogWriterService implements OnModuleInit, OnModuleDestroy {
  static readonly FLUSH_INTERVAL_MS = 1000;
  static readonly BATCH_SIZE = 500;
  static readonly MAX_QUEUE = 50000;
  static readonly DEFAULT_HEARTBEAT_SECONDS = 30;

  private readonly logger = new Logger(WeightLogWriterService.name);
  private queue: PendingRow[] = [];
  private daily = new Map<string, DailyAgg>();
  private last = new Map<string, { weight: number | null; status: string | null; at: number }>();
  private sessions = new Map<string, { key: string; id: string; touchedAt: number }>();
  private timer: NodeJS.Timeout | null = null;
  private flushing: Promise<void> | null = null;
  private dropped = 0;
  private heartbeatMs = WeightLogWriterService.DEFAULT_HEARTBEAT_SECONDS * 1000;
  private heartbeatLoadedAt = 0;

  /** Compteurs exposés pour le diagnostic */
  readonly stats = { received: 0, written: 0, skipped: 0, flushes: 0, errors: 0 };

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit() {
    this.timer = setInterval(() => this.flush().catch(() => undefined), WeightLogWriterService.FLUSH_INTERVAL_MS);
    this.timer.unref?.();
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
  }

  /** Pesée reçue d'une station (après enregistrement du flash courant) */
  record(input: WeightInput): void {
    if (!input?.branch || !input?.station) return;
    this.stats.received++;
    this.refreshHeartbeat();

    const at = input.createdAt ? new Date(input.createdAt) : new Date();
    const weight = toInt(input.sentWeight);
    const status = input.status ?? null;
    const stationKey = `${input.branch}|${input.station}`;

    this.addToDaily(at, input.branch, input.station, weight);

    const prev = this.last.get(stationKey);
    const changed =
      !prev || prev.weight !== weight || prev.status !== status || at.getTime() - prev.at >= this.heartbeatMs;
    if (!changed) {
      this.stats.skipped++;
      return;
    }
    this.last.set(stationKey, { weight, status, at: at.getTime() });

    const sessionInfo = {
      branch: input.branch,
      station: input.station,
      computerName: trunc(input.computerName, 128),
      computerUser: trunc(input.computerUser, 128),
      userName: trunc(input.userName, 128),
      userProfile: trunc(input.userProfile, 255),
    };

    this.queue.push({
      row: {
        createdAt: at,
        branch: input.branch,
        station: input.station,
        sentWeight: weight,
        status,
        reference: trunc(input.reference, 32),
        ticket: trunc(input.ticket, 64),
        inputFromBc: toInt(input.inputFromBc),
        outputFromBc: toInt(input.outputFromBc),
        frame: trunc(input.frame, 255),
        latency: toInt(input.latency),
        isMonitored: !!input.isMonitored,
        timestamp: input.timestamp != null && input.timestamp !== '' ? String(input.timestamp) : null,
      },
      sessionKey: JSON.stringify(sessionInfo),
      sessionInfo,
    });
    const day = this.daily.get(dailyKey(at, input.branch, input.station));
    if (day) day.rows++;

    if (this.queue.length > WeightLogWriterService.MAX_QUEUE) {
      const excess = this.queue.length - WeightLogWriterService.MAX_QUEUE;
      this.queue.splice(0, excess);
      this.dropped += excess;
      this.logger.warn(`File du journal des pesées pleine : ${this.dropped} ligne(s) abandonnée(s) au total`);
    }
    if (this.queue.length >= WeightLogWriterService.BATCH_SIZE) {
      this.flush().catch(() => undefined);
    }
  }

  /** Changement de statut décidé par le serveur (STALE, arrêt automatique) */
  @OnEvent('stale_flash.updated')
  onStaleFlash(flash: WeightInput) {
    this.record({ ...flash, createdAt: new Date() });
  }

  /** Vide la file en base (appelé par le minuteur, à la volée si la file grossit, et à l'arrêt) */
  async flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    if (!this.queue.length && !this.daily.size) return;
    this.flushing = this.doFlush().finally(() => (this.flushing = null));
    return this.flushing;
  }

  private async doFlush() {
    const batch = this.queue.splice(0, WeightLogWriterService.BATCH_SIZE);
    const daily = [...this.daily.values()];
    this.daily.clear();
    try {
      for (const p of batch) {
        p.row.sessionId = await this.resolveSessionId(p.sessionKey, p.sessionInfo, p.row.createdAt as Date);
      }
      if (batch.length) {
        await this.dataSource.getRepository(WeightLog).insert(batch.map((p) => p.row));
      }
      if (daily.length) await this.upsertDaily(daily);
      this.stats.written += batch.length;
      this.stats.flushes++;
    } catch (e) {
      this.stats.errors++;
      this.logger.error(`Écriture du journal des pesées impossible, nouvel essai au prochain cycle : ${e?.message}`);
      // On remet les lignes en tête de file et on refusionne les agrégats
      this.queue.unshift(...batch);
      for (const d of daily) this.mergeDaily(d);
      return;
    }
    if (this.queue.length >= WeightLogWriterService.BATCH_SIZE) {
      setImmediate(() => this.flush().catch(() => undefined));
    }
  }

  private async resolveSessionId(key: string, info: PendingRow['sessionInfo'], at: Date): Promise<string> {
    const stationKey = `${info.branch}|${info.station}`;
    const cached = this.sessions.get(stationKey);
    const repo = this.dataSource.getRepository(StationSession);

    if (cached?.key === key) {
      // Mise à jour de last_seen_at au plus une fois par minute
      if (at.getTime() - cached.touchedAt > 60000) {
        cached.touchedAt = at.getTime();
        await repo.update({ id: cached.id }, { lastSeenAt: at });
      }
      return cached.id;
    }

    // Après un redémarrage : réutiliser la dernière session si elle est identique
    if (!cached) {
      const latest = await repo.findOne({
        where: { branch: info.branch, station: info.station },
        order: { lastSeenAt: 'DESC', id: 'DESC' },
      });
      if (latest && sessionKeyOf(latest) === key) {
        this.sessions.set(stationKey, { key, id: latest.id, touchedAt: 0 });
        return this.resolveSessionId(key, info, at);
      }
    }

    const res = await repo.insert({ ...info, firstSeenAt: at, lastSeenAt: at });
    const id = String(res.identifiers[0].id);
    this.sessions.set(stationKey, { key, id, touchedAt: at.getTime() });
    return id;
  }

  private addToDaily(at: Date, branch: string, station: string, weight: number | null) {
    this.mergeDaily({
      day: toDay(at),
      branch,
      station,
      frames: 1,
      rows: 0,
      weights: weight && weight > 0 ? 1 : 0,
      min: weight && weight > 0 ? weight : null,
      max: weight && weight > 0 ? weight : null,
      sum: weight && weight > 0 ? weight : 0,
    });
  }

  private mergeDaily(d: DailyAgg) {
    const key = `${d.day}|${d.branch}|${d.station}`;
    const cur = this.daily.get(key);
    if (!cur) {
      this.daily.set(key, { ...d });
      return;
    }
    cur.frames += d.frames;
    cur.rows += d.rows;
    cur.weights += d.weights;
    cur.sum += d.sum;
    cur.min = d.min == null ? cur.min : cur.min == null ? d.min : Math.min(cur.min, d.min);
    cur.max = d.max == null ? cur.max : cur.max == null ? d.max : Math.max(cur.max, d.max);
  }

  private async upsertDaily(rows: DailyAgg[]) {
    const values = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',');
    const params = rows.flatMap((d) => [d.day, d.branch, d.station, d.frames, d.rows, d.weights, d.min, d.max, d.sum]);
    await this.dataSource.query(
      `INSERT INTO weight_daily
         (day, branch, station, frames_count, rows_count, weight_count, weight_min, weight_max, weight_sum)
       VALUES ${values}
       ON DUPLICATE KEY UPDATE
         frames_count = frames_count + VALUES(frames_count),
         rows_count   = rows_count   + VALUES(rows_count),
         weight_count = weight_count + VALUES(weight_count),
         weight_min   = LEAST(COALESCE(weight_min, VALUES(weight_min)), COALESCE(VALUES(weight_min), weight_min)),
         weight_max   = GREATEST(COALESCE(weight_max, VALUES(weight_max)), COALESCE(VALUES(weight_max), weight_max)),
         weight_sum   = weight_sum   + VALUES(weight_sum)`,
      params,
    );
  }

  /** Relit le paramètre `audit_heartbeat_seconds` toutes les 5 minutes */
  private refreshHeartbeat() {
    const now = Date.now();
    if (now - this.heartbeatLoadedAt < 5 * 60 * 1000) return;
    this.heartbeatLoadedAt = now;
    Setting.findOneBy({ name: 'audit_heartbeat_seconds' })
      .then((s) => {
        const sec = parseInt(s?.value ?? '', 10);
        this.heartbeatMs = (sec > 0 ? sec : WeightLogWriterService.DEFAULT_HEARTBEAT_SECONDS) * 1000;
      })
      .catch(() => undefined);
  }
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && Math.abs(n) <= 2147483647 ? n : null;
}

function trunc(v: unknown, max: number): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dailyKey(at: Date, branch: string, station: string) {
  return `${toDay(at)}|${branch}|${station}`;
}

function sessionKeyOf(s: StationSession): string {
  return JSON.stringify({
    branch: s.branch,
    station: s.station,
    computerName: s.computerName ?? null,
    computerUser: s.computerUser ?? null,
    userName: s.userName ?? null,
    userProfile: s.userProfile ?? null,
  });
}

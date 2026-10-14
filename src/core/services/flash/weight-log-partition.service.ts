/* eslint-disable prettier/prettier */
import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Partitions mensuelles de `weight_log` et rétention (ADR-0022).
 *
 * - Au démarrage puis toutes les 6 h :
 *   1. si la table n'est pas encore partitionnée, elle l'est par mois sur `measured_at` ;
 *   2. les partitions du mois courant et des 2 mois suivants sont créées à l'avance ;
 *   3. les partitions plus anciennes que `audit_retention_months` (12 par défaut) sont supprimées
 *      par DROP PARTITION : instantané, sans DELETE massif qui bloquerait la base.
 * - Le résumé `weight_daily` n'est jamais purgé.
 */
@Injectable()
export class WeightLogPartitionService implements OnApplicationBootstrap, OnModuleDestroy {
  static readonly TABLE = 'weight_log';
  static readonly DEFAULT_RETENTION_MONTHS = 12;
  static readonly MONTHS_AHEAD = 2;
  static readonly INTERVAL_MS = 6 * 60 * 60 * 1000;

  private readonly logger = new Logger(WeightLogPartitionService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    // Laisse TypeORM finir la synchronisation du schéma avant la première passe
    setTimeout(() => this.maintain().catch(() => undefined), 5000).unref?.();
    this.timer = setInterval(() => this.maintain().catch(() => undefined), WeightLogPartitionService.INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async maintain(now = new Date()): Promise<{ created: string[]; dropped: string[] }> {
    const created: string[] = [];
    const dropped: string[] = [];
    try {
      let parts = await this.listPartitions();

      if (!parts.length) {
        const first = await this.oldestMonth(now);
        const months = monthRange(first, addMonths(startOfMonth(now), WeightLogPartitionService.MONTHS_AHEAD));
        await this.dataSource.query(
          `ALTER TABLE ${WeightLogPartitionService.TABLE}
           PARTITION BY RANGE (TO_DAYS(measured_at)) (
             ${months.map(partitionDef).join(',\n')},
             PARTITION pmax VALUES LESS THAN MAXVALUE
           )`,
        );
        created.push(...months.map(partitionName));
        parts = await this.listPartitions();
      }

      // Données plus anciennes que la première partition (ex. après la migration de audit_flash) :
      // on découpe la première partition en mois pour que la rétention s'applique correctement.
      const firstNamed = parts.find((p) => /^p\d{6}$/.test(p));
      if (firstNamed) {
        const firstMonth = monthOfPartition(firstNamed);
        const oldest = await this.oldestMonth(firstMonth);
        if (oldest < firstMonth) {
          const months = monthRange(oldest, firstMonth);
          await this.dataSource.query(
            `ALTER TABLE ${WeightLogPartitionService.TABLE}
             REORGANIZE PARTITION ${firstNamed} INTO (
               ${months.map(partitionDef).join(',\n')}
             )`,
          );
          created.push(...months.slice(0, -1).map(partitionName));
          parts = await this.listPartitions();
        }
      }

      // Partitions à venir
      const existing = new Set(parts);
      // du mois qui suit la dernière partition (pas de trou si le serveur est resté arrêté) à now + 2 mois
      const wanted = monthRange(addMonths(lastMonthOf(parts), 1), addMonths(startOfMonth(now), WeightLogPartitionService.MONTHS_AHEAD));
      const missing = wanted.filter((m) => !existing.has(partitionName(m)));
      if (missing.length && existing.has('pmax')) {
        await this.dataSource.query(
          `ALTER TABLE ${WeightLogPartitionService.TABLE}
           REORGANIZE PARTITION pmax INTO (
             ${missing.map(partitionDef).join(',\n')},
             PARTITION pmax VALUES LESS THAN MAXVALUE
           )`,
        );
        created.push(...missing.map(partitionName));
      }

      // Rétention
      const retention = await this.retentionMonths();
      const oldestKept = partitionName(addMonths(startOfMonth(now), -(retention - 1)));
      const toDrop = parts.filter((p) => /^p\d{6}$/.test(p) && p < oldestKept);
      if (toDrop.length) {
        await this.dataSource.query(`ALTER TABLE ${WeightLogPartitionService.TABLE} DROP PARTITION ${toDrop.join(', ')}`);
        dropped.push(...toDrop);
      }

      if (created.length || dropped.length) {
        this.logger.log(`Partitions weight_log : créées [${created.join(', ')}], supprimées [${dropped.join(', ')}]`);
      }
    } catch (e) {
      this.logger.error(`Maintenance des partitions weight_log impossible : ${e?.message}`);
    }
    return { created, dropped };
  }

  private async listPartitions(): Promise<string[]> {
    const rows = await this.dataSource.query(
      `SELECT PARTITION_NAME AS name FROM information_schema.PARTITIONS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND PARTITION_NAME IS NOT NULL
       ORDER BY PARTITION_ORDINAL_POSITION`,
      [WeightLogPartitionService.TABLE],
    );
    return rows.map((r: any) => r.name ?? r.NAME);
  }

  private async oldestMonth(now: Date): Promise<Date> {
    const [row] = await this.dataSource.query(`SELECT MIN(measured_at) AS m FROM ${WeightLogPartitionService.TABLE}`);
    const min = row?.m ? new Date(row.m) : now;
    return startOfMonth(min < now ? min : now);
  }

  private async retentionMonths(): Promise<number> {
    const rows = await this.dataSource
      .query(`SELECT value FROM setting WHERE name = 'audit_retention_months' LIMIT 1`)
      .catch(() => []);
    const n = parseInt(rows?.[0]?.value ?? '', 10);
    return n > 0 ? n : WeightLogPartitionService.DEFAULT_RETENTION_MONTHS;
  }
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/** Mois de `from` à `to` inclus */
function monthRange(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  for (let m = startOfMonth(from); m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

function partitionName(m: Date): string {
  return `p${m.getUTCFullYear()}${String(m.getUTCMonth() + 1).padStart(2, '0')}`;
}

function partitionDef(m: Date): string {
  const next = addMonths(m, 1).toISOString().slice(0, 10);
  return `PARTITION ${partitionName(m)} VALUES LESS THAN (TO_DAYS('${next}'))`;
}

function monthOfPartition(p: string): Date {
  return new Date(Date.UTC(+p.slice(1, 5), +p.slice(5, 7) - 1, 1));
}

/** Dernier mois couvert par une partition nommée (hors pmax) */
function lastMonthOf(parts: string[]): Date {
  const named = parts.filter((p) => /^p\d{6}$/.test(p)).sort();
  const last = named[named.length - 1];
  if (!last) return new Date(0);
  return new Date(Date.UTC(+last.slice(1, 5), +last.slice(5, 7) - 1, 1));
}

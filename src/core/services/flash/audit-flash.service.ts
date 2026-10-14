import { PaginatedService } from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, FindOneOptions, LessThan, MoreThan, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { WeightLog } from 'src/core/entities/flash/weight-log.entity';
import { WeightDaily } from 'src/core/entities/flash/weight-daily.entity';
import { Flash } from 'src/core/entities/flash/flash.entity';

export interface AuditFlashStats {
  periodHours: number;
  total: number;
  validWeights: number;
  minWeight: number | null;
  maxWeight: number | null;
  avgWeight: number | null;
  byStatus: { status: string; count: number }[];
}

export interface AuditFlashDetails {
  audit: WeightLog;
  previous: WeightLog | null;
  next: WeightLog | null;
  /** Événements de la même station autour de l'audit (du plus récent au plus ancien) */
  timeline: WeightLog[];
  /** Dernier flash connu de la station (table flash) */
  currentFlash: Flash | null;
  /** Statistiques de la station sur les `periodHours` heures précédant l'audit */
  stats: AuditFlashStats;
}

@Injectable()
export class AuditFlashService {
  // Lecture seule : les pesées sont écrites par WeightLogWriterService (ADR-0022)
  public NOT_FOUND_MESSAGE = `Pesée non trouvée dans le journal`;

  constructor(
    @InjectRepository(WeightLog)
    private _repository: Repository<WeightLog>,
    protected paginatedService: PaginatedService<WeightLog>,
    @Inject(REQUEST) protected request: any,
  ) {}

  async readPaginatedListRecord(options?: FindManyOptions<WeightLog>, page?: number, perPage?: number) {
    return await this.paginatedService.paginate(this.repository, page, perPage, options);
  }

  async readOneRecord(options?: FindOneOptions<WeightLog>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return entity;
  }

  /**
   * Détail complet d'un audit flash : enregistrement, voisins (précédent / suivant)
   * sur la même station, chronologie, flash courant et statistiques.
   */
  async readDetails(
    id: string,
    options: { around?: number; periodHours?: number } = {},
  ): Promise<AuditFlashDetails> {
    const around = Math.min(Math.max(Number(options.around) || 10, 1), 50);
    const periodHours = Math.min(Math.max(Number(options.periodHours) || 24, 1), 24 * 31);

    const audit = await this.readOneRecord({ where: { id } });
    const sameStation = { branch: audit.branch, station: audit.station };

    const [previous, next, before, after, currentFlash, stats] = await Promise.all([
      this.repository.findOne({
        where: { ...sameStation, createdAt: LessThan(audit.createdAt) },
        order: { createdAt: 'DESC' },
      }),
      this.repository.findOne({
        where: { ...sameStation, createdAt: MoreThan(audit.createdAt) },
        order: { createdAt: 'ASC' },
      }),
      this.repository.find({
        where: { ...sameStation, createdAt: LessThan(audit.createdAt) },
        order: { createdAt: 'DESC' },
        take: around,
      }),
      this.repository.find({
        where: { ...sameStation, createdAt: MoreThan(audit.createdAt) },
        order: { createdAt: 'ASC' },
        take: around,
      }),
      this.repository.manager.getRepository(Flash).findOne({
        where: sameStation,
        order: { createdAt: 'DESC' },
      }),
      this.readStationStats(audit.branch, audit.station, audit.createdAt, periodHours),
    ]);

    return {
      audit,
      previous,
      next,
      timeline: [...after.reverse(), audit, ...before],
      currentFlash,
      stats,
    };
  }

  /** Statistiques d'une station sur une fenêtre glissante se terminant à `until` */
  async readStationStats(
    branch: string,
    station: string,
    until: Date = new Date(),
    periodHours = 24,
  ): Promise<AuditFlashStats> {
    const from = new Date(new Date(until).getTime() - periodHours * 3600 * 1000);
    const where = { branch, station, createdAt: Between(from, new Date(until)) };

    const byStatusRaw = await this.repository
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.branch = :branch AND a.station = :station', { branch, station })
      .andWhere('a.createdAt BETWEEN :from AND :until', { from, until: new Date(until) })
      .groupBy('a.status')
      .getRawMany();

    const weights = await this.repository
      .createQueryBuilder('a')
      .select('MIN(a.sentWeight)', 'min')
      .addSelect('MAX(a.sentWeight)', 'max')
      .addSelect('AVG(a.sentWeight)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('a.branch = :branch AND a.station = :station', { branch, station })
      .andWhere('a.createdAt BETWEEN :from AND :until', { from, until: new Date(until) })
      .andWhere('a.sentWeight > 0')
      .getRawOne();

    const total = await this.repository.count({ where });

    return {
      periodHours,
      total,
      validWeights: Number(weights?.count ?? 0),
      minWeight: weights?.min !== null && weights?.min !== undefined ? Number(weights.min) : null,
      maxWeight: weights?.max !== null && weights?.max !== undefined ? Number(weights.max) : null,
      avgWeight: weights?.avg !== null && weights?.avg !== undefined ? Math.round(Number(weights.avg)) : null,
      byStatus: byStatusRaw.map((r) => ({ status: r.status ?? 'UNKNOWN', count: Number(r.count) })),
    };
  }

  /**
   * Résumé journalier d'une station (table weight_daily, conservée sans limite).
   */
  async readDaily(branch: string, station: string, days = 90): Promise<WeightDaily[]> {
    const n = Math.min(Math.max(Number(days) || 90, 1), 3660);
    const from = new Date(Date.now() - n * 24 * 3600 * 1000).toISOString().slice(0, 10);
    return this.repository.manager.getRepository(WeightDaily)
      .createQueryBuilder('d')
      .where('d.branch = :branch AND d.station = :station AND d.day >= :from', { branch, station, from })
      .orderBy('d.day', 'DESC')
      .getMany();
  }

  get repository(): Repository<WeightLog> {
    return this._repository;
  }
}

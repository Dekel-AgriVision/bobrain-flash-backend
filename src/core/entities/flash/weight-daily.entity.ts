import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Résumé journalier par station, conservé sans limite de durée (ADR-0022).
 * Alimenté à chaque écriture groupée : il compte TOUTES les trames reçues,
 * y compris celles qui ne sont pas recopiées dans `weight_log` (doublons).
 */
@Entity({ name: 'weight_daily' })
export class WeightDaily extends BaseEntity {
  @ApiProperty() @PrimaryColumn({ type: 'date' }) day: string;
  @ApiProperty() @PrimaryColumn({ length: 32 }) branch: string;
  @ApiProperty() @PrimaryColumn({ length: 32 }) station: string;

  @ApiProperty({ description: `Trames reçues` })
  @Column({ name: 'frames_count', type: 'int', default: 0 })
  framesCount: number;

  @ApiProperty({ description: `Lignes écrites dans weight_log` })
  @Column({ name: 'rows_count', type: 'int', default: 0 })
  rowsCount: number;

  @ApiProperty({ description: `Trames avec un poids > 0` })
  @Column({ name: 'weight_count', type: 'int', default: 0 })
  weightCount: number;

  @ApiProperty() @Column({ name: 'weight_min', type: 'int', nullable: true }) weightMin: number;
  @ApiProperty() @Column({ name: 'weight_max', type: 'int', nullable: true }) weightMax: number;
  @ApiProperty() @Column({ name: 'weight_sum', type: 'bigint', default: 0 }) weightSum: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AfterLoad,
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { STATUS_MAP, StatusFlashEnum } from 'src/core/definitions/enums';
import { StationSession } from './station-session.entity';

/**
 * Journal des pesées (remplace l'écriture dans `audit_flash`, ADR-0022).
 *
 * - Une ligne par changement de poids ou de statut d'une station, plus un battement
 *   périodique : les trames strictement identiques ne sont pas répétées.
 * - Table partitionnée par mois sur `measured_at` (cf. WeightLogPartitionService) :
 *   la clé primaire inclut donc `measured_at`.
 * - Les noms de propriétés reprennent ceux de `AuditFlash` (createdAt, sentWeight,
 *   status, statusMsg, userName...) pour garder la même API côté backoffice.
 */
@Entity({ name: 'weight_log' })
@Index('IDX_weight_log_station_time', ['branch', 'station', 'createdAt'])
@Index('IDX_weight_log_time', ['createdAt'])
export class WeightLog extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  /** Date de réception de la pesée (= createdAt du flash) */
  @ApiProperty({ description: `Date de la pesée` })
  @PrimaryColumn({ name: 'measured_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty() @Column({ length: 32 }) branch: string;
  @ApiProperty() @Column({ length: 32 }) station: string;

  @ApiProperty({ description: `Poids envoyé` })
  @Column({ name: 'sent_weight', type: 'int', nullable: true })
  sentWeight: number;

  @ApiProperty() @Column({ length: 32, nullable: true }) status: string;

  @ApiPropertyOptional() @Column({ length: 32, nullable: true }) reference: string;
  @ApiPropertyOptional() @Column({ length: 64, nullable: true }) ticket: string;
  @ApiPropertyOptional() @Column({ name: 'input_from_bc', type: 'int', nullable: true }) inputFromBc: number;
  @ApiPropertyOptional() @Column({ name: 'output_from_bc', type: 'int', nullable: true }) outputFromBc: number;

  @ApiPropertyOptional({ description: `Trame brute de l'afficheur` })
  @Column({ length: 255, nullable: true })
  frame: string;

  @ApiPropertyOptional({ description: `Latence (ms)` })
  @Column({ type: 'int', nullable: true })
  latency: number;

  @ApiProperty() @Column({ name: 'is_monitored', default: false }) isMonitored: boolean;

  @ApiPropertyOptional({ description: `Horodatage du poste` })
  @Column({ type: 'bigint', nullable: true })
  timestamp: string;

  @Column({ name: 'session_id', type: 'bigint', nullable: true })
  sessionId: string;

  @ManyToOne(() => StationSession, { eager: true, nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'session_id' })
  session: StationSession;

  // Champs calculés, pour compatibilité avec l'ancien format AuditFlash
  statusMsg: string;
  computerName: string;
  computerUser: string;
  userName: string;
  userProfile: string;

  @AfterLoad()
  fillComputedFields() {
    this.statusMsg = STATUS_MAP[this.status as StatusFlashEnum]?.label ?? this.status;
    this.computerName = this.session?.computerName ?? null;
    this.computerUser = this.session?.computerUser ?? null;
    this.userName = this.session?.userName ?? null;
    this.userProfile = this.session?.userProfile ?? null;
  }
}

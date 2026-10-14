import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Informations du poste de pesée (ordinateur, utilisateur Windows, profil).
 * Une ligne par combinaison distincte, écrite seulement quand elle change :
 * ces textes ne sont plus répétés sur chaque pesée de `weight_log` (ADR-0022).
 */
@Entity({ name: 'station_session' })
@Index('IDX_station_session_station', ['branch', 'station', 'lastSeenAt'])
export class StationSession extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ApiProperty() @Column({ length: 32 }) branch: string;
  @ApiProperty() @Column({ length: 32 }) station: string;

  @ApiProperty() @Column({ name: 'computer_name', length: 128, nullable: true }) computerName: string;
  @ApiProperty() @Column({ name: 'computer_user', length: 128, nullable: true }) computerUser: string;
  @ApiProperty() @Column({ name: 'user_name', length: 128, nullable: true }) userName: string;
  @ApiProperty() @Column({ name: 'user_profile', length: 255, nullable: true }) userProfile: string;

  @Column({ name: 'first_seen_at', type: 'datetime', precision: 3 }) firstSeenAt: Date;
  @Column({ name: 'last_seen_at', type: 'datetime', precision: 3 }) lastSeenAt: Date;
}

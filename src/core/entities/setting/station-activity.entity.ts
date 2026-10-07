/* eslint-disable prettier/prettier */
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Station } from './station.entity';
import { ActivityType } from 'src/core/definitions/enums';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class StationActivity extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string;

  @ApiProperty({ type: 'object', description: `Station` })
  @ManyToOne(() => Station, (station) => station.stationActivities, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

@Column({ type: 'enum',enum: ActivityType, nullable:false })
@ApiProperty({ required: false, description: `Actif` })
type: ActivityType;

  @ApiProperty({ type: 'object', description: `Succursale` })
  @ManyToOne(() => Branch, (branch) => branch.stationActivities, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsOptional()
  @Column({ type: 'timestamp', name: 'start_at', nullable: true })
  startAt: Date;

  @IsOptional()
  @Column({ type: 'timestamp', name: 'end_at', nullable: true })
  endAt: Date;


  @IsString()
  @ApiProperty({ description: `Raison Code` })
  @Column({ name: 'reason_code', nullable:true })
  reasoncode: string;

  @IsString()
  @ApiProperty({ description: `Raison` })
  @Column({ name: 'reason',default: '' })
  reason: string;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}


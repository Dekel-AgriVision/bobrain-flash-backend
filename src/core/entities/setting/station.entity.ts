import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
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
import { StationActivity } from './station-activity.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Station extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Code` })
  @Index()
  @Column({ name: 'code' })
  code: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Libellé` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({ type: 'object', description: `Succursale` })
  @ManyToOne(() => Branch, (branch) => branch.users, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [StationActivity] })
  @OneToMany(
    () => StationActivity,
    (stationActivity) => stationActivity.station,
  )
  stationActivities: StationActivity[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}

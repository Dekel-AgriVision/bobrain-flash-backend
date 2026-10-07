import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class BaseCoreEntity extends BaseEntity {
  @IsUUID()
  @ApiProperty({})
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'La date de création',
  })
  @CreateDateColumn({ name: 'created_at', nullable: true })
  createdAt: Date;

  @ApiProperty({
    description: 'La dernière date de modification des informations ',
    required: false,
  })
  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @ApiProperty({
    description: 'La date de suppression ',
    required: false,
  })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ApiProperty({
    description: 'La date de cloture ',
    required: false,
  })
  @DeleteDateColumn({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @ApiProperty({
    description: 'La date de lancement ',
    required: false,
  })
  @DeleteDateColumn({ name: 'released_at', nullable: true })
  releasedAt: Date;

  @ApiPropertyOptional()
  @Column({
    name: 'created_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  createdById: string;

  @ApiPropertyOptional()
  @Column({
    name: 'updated_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  updatedById: string;

  @ApiPropertyOptional()
  @Column({
    name: 'deleted_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  deletedById: string;
}

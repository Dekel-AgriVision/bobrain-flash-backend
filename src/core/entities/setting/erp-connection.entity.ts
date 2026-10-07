import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Entity } from 'typeorm';
import { Branch } from '../subsidiary/branch.entity';

@Entity()
export class ErpConnection extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `code unique ` })
  @Index()
  @Column({ name: 'code' })
  code: string; // ex: api/v1

  @IsNumber()
  @ApiProperty({ description: `port de connexion a l'ERP` })
  @Column({ nullable: true })
  port: number;

  @IsString()
  @ApiProperty({ description: ` api_uri de connexion a l'ERP` })
  @Column({ name: 'api_uri', nullable: true })
  apiUri: string; // ex: api/v1

  @IsString()
  @ApiProperty({ description: ` base_url de connexion a l'ERP` })
  @Column({ name: 'base_url', nullable: true })
  baseUrl: string; // ex: api/v1

  @IsString()
  @ApiProperty({ description: `auth_uri de connexion a l'ERP` })
  @Column({ name: 'auth_uri', nullable: true })
  authUri: string;

  // 🔌 WebSocket ERP
  @IsString()
  @ApiProperty({ description: `ws_uri de connexion a l'ERP` })
  @Column({ name: 'ws_uri', nullable: true })
  wsUri: string;

  // 🔐 Credentials
  @IsString()
  @ApiProperty({ description: `login de connexion a l'ERP` })
  @Column({ name: 'login', nullable: true })
  login: string;

  @IsString()
  @ApiProperty({ description: `password de connexion a l'ERP` })
  @Column({ name: 'password', nullable: true })
  password: string; // ⚠️ à chiffrer

  // ⚙️ Options
  @IsBoolean()
  @ApiProperty({ description: `isActive de connexion a l'ERP` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsBoolean()
  @ApiProperty({ description: ` is_default de connexion a l'ERP` })
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

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

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}

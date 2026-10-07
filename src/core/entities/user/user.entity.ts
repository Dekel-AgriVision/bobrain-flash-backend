/* eslint-disable prettier/prettier */
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import bcrypt from 'bcrypt';
import { PersonCoreEntity } from '../base/person.core.entity';
import { Branch } from '../subsidiary/branch.entity';
import { Role } from './role.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuthUser } from '../session/auth-user.entity';
import { userTypeEnum } from 'src/core/definitions/enums';

/**
 * Front office user
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class User extends PersonCoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom d'utilisateur`, uniqueItems: true })
  @Index()
  @Column({ type: 'varchar' })
  username: string;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  password: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Compte actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string;

  @IsString()
  @IsOptional()
  @Column({ name: 'type', nullable: true })
  type: userTypeEnum;

  @ApiProperty({ type: 'object', description: `Rôle` })
  @ManyToOne(() => Role, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

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

  @ApiPropertyOptional()
  @Column({
    name: 'last_access_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  lastAccessId: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'last_access_id' })
  lastAccess: AuthUser;

   /* Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  /**
   * Set user password
   */
  async setNewPassword(password: string): Promise<string> {
    const salt = bcrypt.genSaltSync(13);
    this.password = bcrypt.hashSync(password, salt);
    return this.password;
  }

  /**
   * Verify user password
   */
  async checkPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, String(this.password ?? ''));
  }

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}

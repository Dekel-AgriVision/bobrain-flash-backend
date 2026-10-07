import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AuthUserData } from '../../classes/auth-user.data';
import { AbilitySubjectEnum } from '../../definitions/enums';
import { AuthLog } from './auth-log.entity';
import { CoreEntity } from '../base/core.entity';
import { Branch } from '../subsidiary/branch.entity';
import { Role } from '../user/role.entity';
import { User } from '../user/user.entity';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { Details } from 'express-useragent';
import {
  AbilityTuple,
  AnyAbility,
  createMongoAbility,
  CanParameters,
  ForbiddenError,
  RawRule,
} from '@casl/ability';
import _ from 'lodash';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Exclude, instanceToPlain } from 'class-transformer';

/**
 * User session
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class AuthUser extends CoreEntity {
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  private _abilityRules: RawRule[];

  @IsUUID()
  @IsOptional()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ApiProperty({ description: `Utilisateur front office` })
  @ManyToOne(() => User, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: `Nom d'utilisateur` })
  @Column()
  username: string;

  @ApiProperty({ description: `Validité`, default: false })
  @Column({ name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'last_access_date', nullable: true })
  lastAccessDate: Date;

  @Column({ name: 'user_agent', type: 'simple-json', nullable: true })
  userAgent: Details;

  @ApiProperty({
    type: AuthUserData,
    description: `Données de l'utilisateur`,
  })
  @Column({ name: 'user_data', type: 'simple-json' })
  userData: AuthUserData;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string;

  @ApiProperty({
    required: false,
    type: () => Role,
    description: `Role d'un utilisateur front office`,
  })
  @ManyToOne(() => Role, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'target_branch_id', type: 'uuid', nullable: true })
  targetBranchId: string;

  @ApiProperty({
    required: false,
    type: () => Branch,
    description: `Succursale cibe de la session de l'utilisateur`,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'target_branch_id' })
  targetBranch: Branch;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({
    required: false,
    type: () => Branch,
    description: `Succursale de l'utilisateur`,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'application_id' })
  applicationId: string;

  @Column({ name: 'auth_log_id', type: 'uuid', nullable: true })
  authLogId: string;

  @ApiProperty({
    required: false,
    type: () => AuthLog,
    description: `Tentative d'authentification`,
  })
  @OneToOne(() => AuthLog, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'auth_log_id' })
  authLog: AuthLog;

  @ApiProperty({
    description: 'La date de déconnexion.',
    required: false,
  })
  @Column({ name: 'logout_at', type: 'datetime', nullable: true })
  logoutAt: Date;

  @ApiPropertyOptional()
  @Column({
    name: 'logout_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  logoutById: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'logout_by_id' })
  logoutBy: AuthUser;

  /**
   * Getters & Setters **************************************
   */

  // END Getters & Setters **************************************

  /**
   * Methods *******************************************
   */

  /**
   * Check if is frontoffice session
   */
  async can(...args: CanParameters<AbilityTuple>) {
    return (await this.getAbility()).can(...args);
  }

  async cannot(...args: CanParameters<AbilityTuple>) {
    return (await this.getAbility()).cannot(...args);
  }

  async throwUnlessCan(...args: CanParameters<AbilityTuple>) {
    try {
      ForbiddenError.from(
        (await this.getAbility()) as AnyAbility,
      ).throwUnlessCan(...args);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException(`Accès réfusé`);
      }

      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Accès à toutes les succursales (remplace l'ancien test `can('manage', 'all')`) :
   * rôle avec accès complet ou compte rattaché à la société mère.
   */
  hasAllBranchesAccess(): boolean {
    return this.role?.adminPermission === true || this.branch?.isParentCompany === true;
  }

  async getAbililyRules() {
    if (!_.isEmpty(this._abilityRules)) return this._abilityRules;
    // Copie : ne pas muter les règles mises en cache par le rôle
    let rules: RawRule[] = _.cloneDeep((await this.role?.buildAbilityRules()) ?? []);

    if (!this.hasAllBranchesAccess()) {
      rules = await this.applyBranchRules(rules);
    }

    this._abilityRules = rules;

    return this._abilityRules;
  }

  async getAbility() {
    const rules = await this.getAbililyRules();
    // Compte sans rôle : aucune permission (au lieu d'une erreur 500 sur `this.role` null)
    if (!this.role) {
      return createMongoAbility(rules as any);
    }
    return this.role.buildAbility(rules);
  }

  private async applyBranchRules(rules: RawRule[]) {
    rules = (rules || []).map((rule) => {
      switch (rule.subject) {
        case AbilitySubjectEnum.Branch:
          rule.conditions = _.merge({}, rule.conditions, {
            id: { $eq: this.branchId },
          });
          break;
        case AbilitySubjectEnum.User:
        case AbilitySubjectEnum.AuthUser:
        case AbilitySubjectEnum.Station:
        case AbilitySubjectEnum.Flash:
          rule.conditions = _.merge({}, rule.conditions, {
            branchId: { $eq: this.branchId },
          });
          break;
        case AbilitySubjectEnum.Role:
          rule.conditions = _.merge({}, rule.conditions, {
            branchId: { $eq: this.branchId },
          });
          break;
      }
      return rule;
    });
    return rules;
  }

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}

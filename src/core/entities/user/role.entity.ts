import { Column, Index } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  AbilityTuple,
  CanParameters,
  createMongoAbility,
  RawRule,
} from '@casl/ability';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import _ from 'lodash';
import { RolePermissionsType } from '../../definitions/types';
import { CoreEntity } from '../base/core.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import {
  AbilityActionEnum,
  AbilitySubjectEnum,
  RoleEnum,
} from '../../definitions/enums';
import { Entity } from 'typeorm';

@Entity()
export class Role extends CoreEntity {
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  private _abilityRules: RawRule[];

  @IsNotEmpty()
  @IsString()
  // Type de rôle : plusieurs rôles peuvent partager le même type, sauf `manager` (ADR-0021)
  @ApiProperty({ description: `Type de rôle (manager, admin, guest...). Non unique, sauf manager.` })
  @Index()
  @Column()
  name: RoleEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Nom du rôle (unique, obligatoire à la création)` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ name: 'admin_permission', nullable: true, default: false })
  adminPermission: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'simple-json', nullable: true })
  permissions: RolePermissionsType;

  /**
   * Methods *******************************************
   */
  async can(...args: CanParameters<AbilityTuple>) {
    return (await this.buildAbility()).can(...args);
  }

  async cannot(...args: CanParameters<AbilityTuple>) {
    return (await this.buildAbility()).cannot(...args);
  }

  /**
   * Actions accordées explicitement (jamais `manage`, jamais le sujet `all`).
   */
  static readonly GRANTABLE_ACTIONS: AbilityActionEnum[] = [
    AbilityActionEnum.read,
    AbilityActionEnum.create,
    AbilityActionEnum.edit,
    AbilityActionEnum.delete,
    AbilityActionEnum.stream,
  ];

  /**
   * Sujets métier pouvant recevoir des droits (tous sauf `all`).
   */
  static get GRANTABLE_SUBJECTS(): AbilitySubjectEnum[] {
    return Object.values(AbilitySubjectEnum).filter(
      (s) => s !== AbilitySubjectEnum.all,
    );
  }

  /**
   * Construit les règles CASL à partir des permissions du rôle.
   *
   * - Aucune règle `manage` / `all` n'est générée : chaque droit est explicite
   *   (sujet × action), ce qui évite d'ouvrir implicitement de futurs sujets.
   * - `adminPermission: true` => toutes les actions sur tous les sujets métier.
   * - `permissions[Sujet] === true` => toutes les actions sur ce sujet.
   * - `permissions[Sujet] = { read: true, ... }` => uniquement les actions cochées.
   * - Les clés inconnues (`manage`, `all`, `admin`, sujets hors enum) sont ignorées.
   */
  async buildAbilityRules() {
    if (!_.isEmpty(this._abilityRules)) return this._abilityRules;

    const subjects = Role.GRANTABLE_SUBJECTS as string[];
    const actions = Role.GRANTABLE_ACTIONS as string[];
    const rules: RawRule[] = [];
    const push = (subject: string, action: string) => {
      if (!rules.some((r) => r.subject === subject && r.action === action)) {
        rules.push({ subject, action } as RawRule);
      }
    };

    if (this.adminPermission === true) {
      subjects.forEach((subject) => actions.forEach((action) => push(subject, action)));
    } else {
      for (const [subject, value] of Object.entries(
        this?.permissions ?? ({} as RolePermissionsType),
      )) {
        if (!subjects.includes(subject)) continue;

        if (value === true) {
          actions.forEach((action) => push(subject, action));
        } else if (_.isPlainObject(value)) {
          for (const [action, granted] of Object.entries(value)) {
            if (granted === true && actions.includes(action)) {
              push(subject, action);
            }
          }
        }
      }
    }

    this._abilityRules = rules;
    return rules;
  }

  async buildAbility(rules?: RawRule[]) {
    return createMongoAbility(
      rules ?? ((await this.buildAbilityRules()) as any),
    );
  }

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}

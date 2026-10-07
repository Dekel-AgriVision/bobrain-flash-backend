import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Column, Entity } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import {
  RolePermissionsType,
  RoleFieldPermissionsType,
} from 'src/core/definitions/types';
import { AccessTypeEnum } from 'src/core/definitions/enums';

/**
 * Relationship table {user, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class AccessToRole extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'access_id', type: 'uuid', nullable: false })
  accessId: string;

  /* @ApiProperty({ required: false, type: () => Access })
  @ManyToOne(() => Access, (access) => access.accessToRoles, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'access_id' })
  access: Access;*/

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: ` Acces Invite Actif` })
  @Column({ name: 'is_guest_access', default: false })
  isGuestAccess: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Acces Manager Actif` })
  @Column({ name: 'is_manager_access', default: false })
  isManagerAccess: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Acces Manager Actif` })
  @Column({ name: 'is_owner_access', default: false })
  isOwnerAccess: boolean;

  @IsNotEmpty()
  @IsIn(Object.values(AccessTypeEnum))
  @ApiProperty({
    enum: AccessTypeEnum,
    enumName: 'AccessTypeEnum',
    description: `Role type acces `,
  })
  @Column({ name: 'access_type' })
  accessType: AccessTypeEnum;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ name: 'admin_permission', nullable: true, default: false })
  adminPermission: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'simple-json', nullable: true })
  permissions: RolePermissionsType;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ name: 'field_permissions', type: 'simple-json', nullable: true })
  fieldPermissions: RoleFieldPermissionsType;
}

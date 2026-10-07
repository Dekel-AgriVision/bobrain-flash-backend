import { ApiProperty, PickType } from '@nestjs/swagger';
import { Role } from '../../entities/user/role.entity';
import { AccessToRole } from 'src/core/entities/user/access-to-role.entity';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto extends PickType(Role, [
  'name',
  'displayName',
  'description',
  'isActive',
  'adminPermission',
  'permissions',
] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAccessToRoleDto)
  @ApiProperty({
    type: () => [CreateAccessToRoleDto],
    description: `Accces auxquelles appartiennent le role`,
  })
  accessToRoles: CreateAccessToRoleDto[];
}

export class CreateAccessToRoleDto extends PickType(AccessToRole, [
  'accessId',
  'isGuestAccess',
  'isManagerAccess',
  'isOwnerAccess',
  'adminPermission',
  'permissions',
  'fieldPermissions',
  'accessType',
] as const) {}

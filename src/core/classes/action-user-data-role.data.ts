import { PartialType, PickType } from '@nestjs/swagger';
import { Role } from '../entities/user/role.entity';

export class ActionUserDataRoleData extends PartialType(
  PickType(Role, ['id', 'name', 'displayName', 'description'] as const),
) {}

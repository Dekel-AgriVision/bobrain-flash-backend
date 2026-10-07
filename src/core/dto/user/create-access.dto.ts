import { PickType } from '@nestjs/swagger';
import { Access } from 'src/core/entities/user/access.entity';

export class CreateAccessDto extends PickType(Access, [
  'name',
  'entity',
  'permissions',
] as const) {}

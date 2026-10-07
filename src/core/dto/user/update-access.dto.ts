import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAccessDto } from './create-access.dto';

export class UpdateAccessDto extends PartialType(
  OmitType(CreateAccessDto, ['entity', 'permissions'] as const),
) {}

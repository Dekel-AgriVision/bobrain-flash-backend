import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateErpConnectionDto } from './create-erpconnection.dto';

export class UpdateErpConnectionDto extends PartialType(
  OmitType(CreateErpConnectionDto, [] as const),
) {}

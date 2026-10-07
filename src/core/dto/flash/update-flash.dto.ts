import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFlashDto } from './create-flash.dto';

export class UpdateFlashDto extends PartialType(
  OmitType(CreateFlashDto, [] as const),
) {}

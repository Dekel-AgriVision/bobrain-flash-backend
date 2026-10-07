import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStationDto } from './create-station.dto';

export class UpdateStationDto extends PartialType(
  OmitType(CreateStationDto, [] as const),
) {}

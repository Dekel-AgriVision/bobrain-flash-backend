import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStationActivityDto } from './create-station-activity.dto';

export class UpdateStationActivityDto extends PartialType(
  OmitType(CreateStationActivityDto, [] as const),
) {}

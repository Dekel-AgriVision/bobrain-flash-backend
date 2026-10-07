import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { StationActivity } from 'src/core/entities/setting/station-activity.entity';

export class CreateStationActivityDto extends PickType(StationActivity, [
  'branchId',
  'stationId',
] as const) {
  @ApiPropertyOptional({ description: `est actives` })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
  @ApiPropertyOptional({ description: `Raison` })
  @IsOptional()
  @IsString()
  reason: string;
}

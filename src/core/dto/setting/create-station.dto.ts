import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Station } from 'src/core/entities/setting/station.entity';

export class CreateStationDto extends PickType(Station, [
  'code',
  'displayName',
  'branchId',
] as const) {
  @ApiPropertyOptional({ description: `est actives` })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

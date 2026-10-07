import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Flash } from 'src/core/entities/flash/flash.entity';

export class CreateFlashDto extends PickType(Flash, [
  'sentWeight',
  'computerUser',
  'computerName',
  'userProfile',
] as const) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ required: true })
  station: any;
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  frame: string;
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  status: string;
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  latency: string;
  @IsOptional()
  @IsNumber()
  timestamp: number;
  @IsOptional()
  @IsBoolean()
  isMonitored: boolean;
}

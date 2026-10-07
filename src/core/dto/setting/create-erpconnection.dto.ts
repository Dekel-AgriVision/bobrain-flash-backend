import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ErpConnection } from 'src/core/entities/setting/erp-connection.entity';

export class CreateErpConnectionDto extends PickType(ErpConnection, [
  'code',
  'login',
  'password',
  'wsUri',
  'apiUri',
  'authUri',
  'branchId',
  'baseUrl',
  'port',
] as const) {
  @ApiPropertyOptional({ description: `est actives` })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
  @ApiPropertyOptional({ description: `par defaut` })
  @IsOptional()
  @IsBoolean()
  isDefault: boolean;
}

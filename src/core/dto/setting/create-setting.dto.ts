import { PickType } from '@nestjs/swagger';
import { Setting } from 'src/core/entities/setting/setting.entity';

export class CreateSettingDto extends PickType(Setting, [
  'name',
  'displayName',
  'value',
] as const) {}

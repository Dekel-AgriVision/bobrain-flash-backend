import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsAnonymous } from 'src/modules/auth/decorators/is-anonymous.decorator';
import { IsPublic } from 'src/modules/auth/decorators/is-public.decorator';
import { DefaultDataService } from '../services/system/default-data.service';

@ApiExcludeController()
@Controller('app')
export class SystemController {
  constructor(private defaultDataService: DefaultDataService) {}

  @IsAnonymous()
  @IsPublic()
  @Post('sync-default-data')
  @HttpCode(HttpStatus.OK)
  async syncDefaultData() {
    return this.defaultDataService.createDefaultData();
  }
}

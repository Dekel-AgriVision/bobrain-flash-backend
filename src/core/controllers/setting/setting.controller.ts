import {
  ApiSearchOneParamOptions,
  ApiSearchOneQueryFilter,
  ApiSearchParamOptions,
  ApiSearchQueryFilter,
  CustomApiErrorResponse,
  CustomApiPaginatedResponse,
  Paginated,
} from '@app/nestjs';
import { buildFilterFromApiSearchParams } from '@app/typeorm';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { Setting } from 'src/core/entities/setting/setting.entity';
import { CreateSettingDto } from 'src/core/dto/setting/create-setting.dto';
import { UpdateSettingDto } from 'src/core/dto/setting/update-setting.dto';
import { SettingService } from 'src/core/services/setting/setting.service';
import { AbilityActionEnum, AbilitySubjectEnum } from 'src/core/definitions/enums';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('setting')
@Controller('setting')
export class SettingController {
  constructor(private service: SettingService) {}

  /**
   * Get paginated setting list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Setting)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Setting>> {
    // Permission check
     await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Setting,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get setting by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':settingId')
  async findOne(
    @Param('settingId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Setting> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  /**
   * Create setting
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateSettingDto,
    @Query() query?: any,
  ): Promise<Setting> {
    const setting = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: setting.id },
    });
  }

  /**
   * Update setting
   */
  @ApiSearchOneQueryFilter()
  @Patch(':settingId')
  async update(
    @Param('settingId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSettingDto,
    @Query() query?: any,
  ): Promise<Setting> {
    const setting = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: setting.id ?? '' },
    });
  }

  /**
   * Remove setting
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':settingId')
  async remove(@Param('settingId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}

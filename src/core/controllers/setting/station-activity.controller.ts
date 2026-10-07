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
import { merge } from 'lodash';

import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';
import { StationActivityService } from 'src/core/services/setting/station-activity.service';
import { StationActivity } from 'src/core/entities/setting/station-activity.entity';
import { CreateStationActivityDto } from 'src/core/dto/setting/create-station-activity.dto';
import { UpdateStationActivityDto } from 'src/core/dto/setting/update-station-activity.dto';
@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('stationActivity')
@Controller('stationActivity')
export class StationActivityController {
  constructor(private service: StationActivityService) {}

  /**
   * Get paginated setting list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(StationActivity)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<StationActivity>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Station,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: [
          'branch.code',
          'station.code',
          'displayName',
          'description',
        ],
      },
    );
    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );
    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get setting by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':stationId')
  async findOne(
    @Param('stationId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<StationActivity> {
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
   * Create station
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateStationActivityDto,
    @Query() query?: any,
  ): Promise<StationActivity> {
    const station = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: station.id },
    });
  }

  /**
   * Update station
   */
  @ApiSearchOneQueryFilter()
  @Patch(':stationId')
  async update(
    @Param('stationId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStationActivityDto,
    @Query() query?: any,
  ): Promise<StationActivity> {
    const station = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: station.id ?? '' },
    });
  }

  /**
   * Remove station
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':stationId')
  async remove(@Param('stationId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}

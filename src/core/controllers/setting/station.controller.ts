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
import { StationService } from 'src/core/services/setting/station.service';
import { Station } from 'src/core/entities/setting/station.entity';
import { CreateStationDto } from 'src/core/dto/setting/create-station.dto';
import { UpdateStationDto } from 'src/core/dto/setting/update-station.dto';
import { merge } from 'lodash';

import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';
@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('station')
@Controller('station')
export class StationController {
  constructor(private service: StationService) {}

  /**
   * Get paginated setting list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Station)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Station>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Station,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['code', 'displayName'],
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
  ): Promise<Station> {
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
    @Body() dto: CreateStationDto,
    @Query() query?: any,
  ): Promise<Station> {
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
    @Body() dto: UpdateStationDto,
    @Query() query?: any,
  ): Promise<Station> {
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

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
import { CreateErpConnectionDto } from 'src/core/dto/setting/create-erpconnection.dto';
import { UpdateErpConnectionDto } from 'src/core/dto/setting/update-erpconnection.dto';
import { merge } from 'lodash';

import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';
import { ErpConnectionService } from 'src/core/services/setting/erp-connection.service';
import { ErpConnection } from 'src/core/entities/setting/erp-connection.entity';
@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('erpconnection')
@Controller('erpconnection')
export class ErpConnectionController {
  constructor(private service: ErpConnectionService) {}

  /**
   * Get paginated setting list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(ErpConnection)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<ErpConnection>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
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
  @Get(':erpconnectionId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('erpconnectionId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<ErpConnection> {
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
    );

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
   * Create erpconnection
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateErpConnectionDto,
    @Query() query?: any,
  ): Promise<ErpConnection> {
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      AbilitySubjectEnum.Branch,
    );

    const erpconnection = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: erpconnection.id },
    });
  }

  /**
   * Update erpconnection
   */
  @ApiSearchOneQueryFilter()
  @Patch(':erpconnectionId')
  async update(
    @Param('erpconnectionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateErpConnectionDto,
    @Query() query?: any,
  ): Promise<ErpConnection> {
    const erpconnection = await this.service.updateRecord(
      { id: id ?? '' },
      dto,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: erpconnection.id ?? '' },
    });
  }

  /**
   * Remove erpconnection
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':erpconnectionId')
  async remove(@Param('erpconnectionId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}

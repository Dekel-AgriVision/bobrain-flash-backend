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
import { Access } from '../../entities/user/access.entity';
import { AccessService } from '../../services/user/access.service';
import { CreateAccessDto } from '../../dto/user/create-access.dto';
import { UpdateAccessDto } from '../../dto/user/update-access.dto';
import { FindManyOptions } from 'typeorm';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { assertCan } from 'src/modules/auth/helpers/assert-can';
import { AbilityActionEnum, AbilitySubjectEnum } from 'src/core/definitions/enums';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('access')
@Controller('access')
export class AccessController {
  constructor(private service: AccessService) {}

  /**
   * Get paginated access list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Access)
  @Get()
  async findAll(@Query() query?: any): Promise<Paginated<Access>> {
    const options: FindManyOptions = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['name', 'displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get one access by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':accessId')
  async findOne(
    @Param('accessId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Access> {
    const params: ApiSearchOneParamOptions = query as ApiSearchOneParamOptions;
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      params,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  /**
   * Create access
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateAccessDto,
    @Query() query?: any,
  ): Promise<Access> {
    await assertCan(authUser, AbilityActionEnum.create, AbilitySubjectEnum.Role);
    const access = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: access.id },
    });
  }

  /**
   * Update access
   */
  @ApiSearchOneQueryFilter()
  @Patch(':accessId')
  async update(
    @CurrentUser() authUser: AuthUser,
    @Param('accessId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccessDto,
    @Query() query?: any,
  ): Promise<Access> {
    await assertCan(authUser, AbilityActionEnum.edit, AbilitySubjectEnum.Role);
    const access = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: access.id },
    });
  }

  /**
   * Remove access
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':accessId')
  async remove(
    @CurrentUser() authUser: AuthUser,
    @Param('accessId', ParseUUIDPipe) id: string,
  ) {
    await assertCan(authUser, AbilityActionEnum.delete, AbilitySubjectEnum.Role);
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}

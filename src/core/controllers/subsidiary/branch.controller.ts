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
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { User } from '../../entities/user/user.entity';
import { BranchService } from '../../services/subsidiary/branch.service';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { UserService } from '../../services/user/user.service';
import { CreateBranchDto } from '../../dto/subsidiary/create-branch.dto';
import { UpdateBranchDto } from '../../dto/subsidiary/update-branch.dto';
import { merge } from 'lodash';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('branch')
@Controller('branch')
export class BranchController {
  constructor(
    private service: BranchService,
    private userService: UserService,
  ) {}

  /**
   * Get paginated branch list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Branch)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Branch>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: [
          'code',
          'displayName',
          'email',
          'phoneNumber',
          'city',
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
   * Get paginated branch list for select
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Branch)
  @Get('/list/select')
  async findPaginatedForSelect(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Branch>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Branch,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName', 'email', 'phoneNumber', 'city'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get one branch by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':branchId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Branch> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );
    const branch = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, branch);

    return branch;
  }

  /**
   * Create branch
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateBranchDto,
    @Query() query?: any,
  ): Promise<Branch> {
    const branch = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: branch.id },
    });
  }

  /**
   * Update branch
   */
  @ApiSearchOneQueryFilter()
  @Patch(':branchId')
  async update(
    @Param('branchId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Query() query?: any,
  ): Promise<Branch> {
    const branch = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: branch.id },
    });
  }

  /**
   * Remove branch
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':branchId')
  async remove(@Param('branchId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }

  /**
   * Get paginated branch users
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(User)
  @Get(':branchId/user')
  async findUsers(
    @CurrentUser() authUser: AuthUser,
    @Param('branchId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Paginated<User>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.User,
    );

    /*const branch = await this.service.readOneRecord({
      where: { id: id ?? '' },
    });*/

    const options = buildFilterFromApiSearchParams(
      this.userService.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: [
          'username',
          'firstName',
          'lastName',
          'phoneNumber',
          'email',
        ],
      },
    );

    return this.userService.readPaginatedListRecord({
      ...options,
      where: {
        ...options?.where,
        //branchId: branch.id || '',
      },
    });
  }
}

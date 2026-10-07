import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { ErpConnection } from 'src/core/entities/setting/erp-connection.entity';
import { CreateErpConnectionDto } from 'src/core/dto/setting/create-erpconnection.dto';
import { UpdateErpConnectionDto } from 'src/core/dto/setting/update-erpconnection.dto';

@Injectable()
export class ErpConnectionService extends AbstractService<ErpConnection> {
  static readListRecord(): any {
    throw new Error('Method not implemented.');
  }
  public NOT_FOUND_MESSAGE = `ErpConnection non trouvée`;

  constructor(
    @InjectRepository(ErpConnection)
    private _repository: Repository<ErpConnection>,
    protected paginatedService: PaginatedService<ErpConnection>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateErpConnectionDto): Promise<ErpConnection> {
    // Check unique code
    if (dto.code) {
      await isUniqueConstraint(
        'code',
        ErpConnection,
        //{ code: dto.code, branchId: dto.branchId },
        { code: dto.code },
        {
          message: `Le code "${dto.code}" est déjà utilisée pour cette branche`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<ErpConnection>,
    dto: UpdateErpConnectionDto,
  ) {
    // Check unique code
    if (dto.code) {
      await isUniqueConstraintUpdate(
        'code',
        ErpConnection,
        {
          code: dto.code,
          //branchId: optionsWhere.branchId,
          id: optionsWhere.id,
        },
        {
          message: `Le code "${dto.code}" est déjà utilisé pour cette branche`,
        },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<ErpConnection>> {
    const authUser = await super.checkSessionBranch();
    if (!authUser.hasAllBranchesAccess()) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async getActiveByBranch(branchId: string): Promise<ErpConnection | null> {
    return await ErpConnection.createQueryBuilder('erp')
      .leftJoinAndSelect('erp.branch', 'branch')
      .where('branch.id = :branchId', { code: branchId })
      .andWhere('erp.isActive = true')
      .getOne();
  }

  get repository(): Repository<ErpConnection> {
    return this._repository;
  }
}

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
import { Station } from 'src/core/entities/setting/station.entity';
import { UpdateStationDto } from 'src/core/dto/setting/update-station.dto';
import { CreateStationDto } from 'src/core/dto/setting/create-station.dto';

@Injectable()
export class StationService extends AbstractService<Station> {
  static readListRecord(): any {
    throw new Error('Method not implemented.');
  }
  public NOT_FOUND_MESSAGE = `Station non trouvée`;

  constructor(
    @InjectRepository(Station)
    private _repository: Repository<Station>,
    protected paginatedService: PaginatedService<Station>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateStationDto): Promise<Station> {
    // Check unique code
    if (dto.code) {
      await isUniqueConstraint(
        'code',
        Station,
        { code: dto.code, branchId: dto.branchId },
        {
          message: `Le code "${dto.code}" est déjà utilisée pour cette branche`,
        },
      );
    }

    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Station,
        { displayName: dto.displayName, branchId: dto.branchId },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée pour cette branche`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Station>,
    dto: UpdateStationDto,
  ) {
    // Check unique code
    if (dto.code) {
      await isUniqueConstraintUpdate(
        'code',
        Station,
        {
          code: dto.code,
          branchId: optionsWhere.branchId,
          id: optionsWhere.id,
        },
        {
          message: `Le code "${dto.code}" est déjà utilisé pour cette branche`,
        },
      );
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Station,
        {
          displayName: dto.displayName,
          branchId: optionsWhere.branchId,
          id: optionsWhere.id,
        },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisé pour cette branche`,
        },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Station>> {
    const authUser = await super.checkSessionBranch();
    if (!authUser.hasAllBranchesAccess()) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  get repository(): Repository<Station> {
    return this._repository;
  }
}

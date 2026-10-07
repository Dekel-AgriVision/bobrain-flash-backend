import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { UpdateStationDto } from 'src/core/dto/setting/update-station.dto';
import { StationActivity } from 'src/core/entities/setting/station-activity.entity';
import { CreateStationActivityDto } from 'src/core/dto/setting/create-station-activity.dto';
import { StationService } from './station.service';
import { BranchService } from '../subsidiary/branch.service';

@Injectable()
export class StationActivityService extends AbstractService<StationActivity> {
  static readListRecord(): any {
    throw new Error('Method not implemented.');
  }
  public NOT_FOUND_MESSAGE = `StationActivity non trouvée`;

  constructor(
    @InjectRepository(StationActivity)
    private _repository: Repository<StationActivity>,
    private readonly stationService: StationService,
    private readonly branchService: BranchService,
    protected paginatedService: PaginatedService<StationActivity>,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateStationActivityDto): Promise<StationActivity> {
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<StationActivity>,
    dto: UpdateStationDto,
  ) {
    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  async getFilterByAuthUserBranch(): Promise<
    FindOptionsWhere<StationActivity>
  > {
    const authUser = await super.checkSessionBranch();
    if (!authUser.hasAllBranchesAccess()) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async startActivity(stationId: string, branchId: string) {
    // Vérifier si déjà une activité en cours
    const existing = await this.readOneRecord({
      where: {
        stationId: stationId,
        branchId: branchId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC', // ou createdAt
      },
    });

    if (existing) return; // déjà actif

    await this.repository.save({
      stationId: stationId,
      branchId: branchId,
      startAt: new Date(),
      isActive: true,
    });
  }

  get repository(): Repository<StationActivity> {
    return this._repository;
  }
}

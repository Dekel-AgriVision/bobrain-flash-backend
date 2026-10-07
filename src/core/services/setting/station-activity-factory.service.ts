/* eslint-disable prettier/prettier */
import { PaginatedService } from '@app/typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StationActivity } from 'src/core/entities/setting/station-activity.entity';
import { Repository } from 'typeorm';
import { StationActivityService } from './station-activity.service';
import { StationService } from './station.service';
import { BranchService } from '../subsidiary/branch.service';

@Injectable()
export class StationActivityFactoryService {
  constructor(
    @InjectRepository(StationActivity)
    private readonly repository: Repository<StationActivity>,
      private readonly stationService: StationService,
    private readonly branchService: BranchService,
    private readonly paginatedService: PaginatedService<StationActivity>,
   
  ) {}

  create(): StationActivityService {
    return new StationActivityService(
      this.repository,
      this.stationService,
      this.branchService,
      this.paginatedService,
      null, // ❌ pas de REQUEST
    );
  }
}

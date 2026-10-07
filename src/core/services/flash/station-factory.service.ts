/* eslint-disable prettier/prettier */
import { PaginatedService } from '@app/typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from 'src/core/entities/setting/station.entity';
import { StationService } from '../setting/station.service';

@Injectable()
export class StationServiceFactory {
  constructor(
    @InjectRepository(Station)
    private readonly repository: Repository<Station>,
    private readonly paginatedService: PaginatedService<Station>,
  ) {}

  create(): StationService {
    return new StationService(
      this.repository,
      this.paginatedService,
      null, // ❌ pas de REQUEST
    );
  }
}

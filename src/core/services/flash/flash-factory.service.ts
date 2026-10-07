/* eslint-disable prettier/prettier */
import { PaginatedService } from '@app/typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flash } from 'src/core/entities/flash/flash.entity';
import { FlashService } from './flash.service';
import { AuditFlashService } from './audit-flash.service';

@Injectable()
export class FlashServiceFactory {
  constructor(
    @InjectRepository(Flash)
    private readonly repository: Repository<Flash>,
    private readonly paginatedService: PaginatedService<Flash>,
    private readonly auditFlashService: AuditFlashService
  ) {}

  create(): FlashService {
    return new FlashService(
      this.repository,
      this.paginatedService,
      this.auditFlashService,
      null, // ❌ pas de REQUEST
    );
  }
}

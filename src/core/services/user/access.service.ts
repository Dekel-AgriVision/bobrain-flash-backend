import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccessDto } from '../../dto/user/create-access.dto';
import { Repository } from 'typeorm';
import { Access } from '../../entities/user/access.entity';
import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { AbstractService } from '../abstract.service';

@Injectable()
export class AccessService extends AbstractService<Access> {
  public NOT_FOUND_MESSAGE = `Rôle non trouvé`;

  constructor(
    @InjectRepository(Access)
    private _repository: Repository<Access>,
    protected paginatedService: PaginatedService<Access>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Access> {
    return this._repository;
  }

  async createRecord(dto: CreateAccessDto) {
    // Check unique name
    if (dto.entity) {
      await isUniqueConstraint(
        'name',
        Access,
        { name: dto.entity },
        { message: `Le code "${dto.entity}" du entité est déjà utilisé` },
      );
    }

    return await super.createRecord(dto);
  }
}

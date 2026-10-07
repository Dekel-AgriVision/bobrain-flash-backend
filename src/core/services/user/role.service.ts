import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from '../../dto/user/create-role.dto';
import { Repository } from 'typeorm';
import { Role } from '../../entities/user/role.entity';
import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { AbstractService } from '../abstract.service';

@Injectable()
export class RoleService extends AbstractService<Role> {
  public NOT_FOUND_MESSAGE = `Rôle non trouvé`;

  constructor(
    @InjectRepository(Role)
    private _repository: Repository<Role>,
    protected paginatedService: PaginatedService<Role>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Role> {
    return this._repository;
  }

  async createRecord(dto: CreateRoleDto) {
    // Check unique name
    if (dto.name) {
      await isUniqueConstraint(
        'name',
        Role,
        { name: dto.name },
        { message: `Le code "${dto.name}" du rôle est déjà utilisé` },
      );
    }
    
    return await super.createRecord(dto);
  }
}

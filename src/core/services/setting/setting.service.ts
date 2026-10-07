import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Setting } from 'src/core/entities/setting/setting.entity';
import { UpdateSettingDto } from 'src/core/dto/setting/update-setting.dto';

@Injectable()
export class SettingService extends AbstractService<Setting> {
  public NOT_FOUND_MESSAGE = `Setting non trouvée`;

  constructor(
    @InjectRepository(Setting)
    private _repository: Repository<Setting>,
    protected paginatedService: PaginatedService<Setting>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  /*async createRecord(dto: any): Promise<Setting> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Setting,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }*/

  async updateRecord(
    optionsWhere: FindOptionsWhere<Setting>,
    dto: UpdateSettingDto,
  ) {
    // Check unique displayName
    /*if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Setting,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }*/

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Setting> {
    return this._repository;
  }
}

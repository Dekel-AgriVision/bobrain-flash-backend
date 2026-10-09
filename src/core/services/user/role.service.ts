import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from '../../dto/user/create-role.dto';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { UpdateRoleDto } from '../../dto/user/update-role.dto';
import { Role } from '../../entities/user/role.entity';
import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { AbstractService } from '../abstract.service';
import { RoleEnum } from '../../definitions/enums';

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

  /**
   * Plusieurs rôles peuvent partager le même type (`name` : admin, guest...)
   * avec des permissions différentes (ADR-0021), SAUF le type `manager`
   * (Gestionnaire), qui reste unique. C'est le libellé (`displayName`) qui
   * distingue les rôles : il est obligatoire et unique.
   * Le type ne se modifie pas après création (UpdateRoleDto omet `name`).
   */
  async createRecord(dto: CreateRoleDto) {
    dto.displayName = dto.displayName?.trim();
    if (!dto.displayName) {
      throw new BadRequestException(
        [{ displayName: [`Le nom du rôle est obligatoire`] }],
        `Le nom du rôle est obligatoire`,
      );
    }
    await this.checkUniqueDisplayName(dto.displayName);

    // Exception : un seul rôle de type gestionnaire (`manager`)
    if (dto.name === RoleEnum.MANAGER) {
      await isUniqueConstraint(
        'name',
        Role,
        { name: RoleEnum.MANAGER },
        { message: `Il existe déjà un rôle Gestionnaire : un seul est autorisé` },
      );
    }

    return await super.createRecord(dto);
  }

  async updateRecord(optionsWhere: FindOptionsWhere<Role>, dto: UpdateRoleDto) {
    if (dto.displayName !== undefined) {
      dto.displayName = dto.displayName?.trim();
      if (!dto.displayName) {
        throw new BadRequestException(
          [{ displayName: [`Le nom du rôle est obligatoire`] }],
          `Le nom du rôle est obligatoire`,
        );
      }
      await this.checkUniqueDisplayName(dto.displayName, optionsWhere.id as string);
    }
    return await super.updateRecord(optionsWhere, dto as any);
  }

  private async checkUniqueDisplayName(displayName: string, exceptId?: string) {
    await isUniqueConstraint(
      'displayName',
      Role,
      exceptId ? { displayName, id: Not(exceptId) } : { displayName },
      { message: `Un rôle nommé "${displayName}" existe déjà` },
    );
  }
}

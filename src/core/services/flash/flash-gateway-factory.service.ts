/* eslint-disable prettier/prettier */
import { PaginatedService } from '@app/typeorm';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flash } from 'src/core/entities/flash/flash.entity';
import { FlashService } from './flash.service';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { AbilityActionEnum, AbilitySubjectEnum, StatusFlashEnum } from 'src/core/definitions/enums';
import { AuditFlashService } from './audit-flash.service';

@Injectable()
export class FlashGatewayServiceFactory {
  constructor(
    @InjectRepository(Flash)
    private readonly repository: Repository<Flash>,
    private readonly moduleRef: ModuleRef,
  ) {}


   
  /**
   * Enregistre une pesée reçue par Socket.IO.
   * Le compte de la station doit avoir la permission `stream` sur `Flash` (ADR-0020).
   */
  async createRecord(user: AuthUser | any, payload: any): Promise<any> {
    const authUser = await this.assertAuthUser(user);
    await authUser?.throwUnlessCan(
      AbilityActionEnum.create,
      AbilitySubjectEnum.Flash,
    );
    console.log('payloasdsdd', payload);
    return await (await this.resolveFlashService(authUser)).createRecord(payload as any);
  }

 async readRecord(user: AuthUser, payload: any): Promise<any> {
    const authUser = await this.assertAuthUser(user);
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Flash,
    );
     const newflash  = (await this.resolveFlashService(authUser)).readOneRecord({where: payload, order: {timestamp: 'DESC'}} as any);
    return await newflash;
  }

  /**
   * Met à jour une pesée (ex. station désactivée) : même exigence `stream` sur `Flash`.
   */
  async updateRecord(user: AuthUser | any, optionsWhere: any, dto: any): Promise<any> {
     const authUser = await this.assertAuthUser(user);
    await authUser?.throwUnlessCan(
      AbilityActionEnum.edit,
      AbilitySubjectEnum.Flash,
    );
    return await (await this.resolveFlashService(authUser)).updateRecord(optionsWhere, dto as any);
  }
 async purgeOldPreviousFlash(user: AuthUser,  dto: any): Promise<any> {
  const authUser = await this.assertAuthUser(user);
   await authUser?.throwUnlessCan(
      AbilityActionEnum.edit,
      AbilitySubjectEnum.Flash,
    );
    const updatedFlash = (await this.resolveFlashService(authUser)).purgeOldPreviousFlash(dto.station, dto.branch);
    return await updatedFlash;
  }



  


  /**
   * Vérifie que l'émetteur Socket.IO a le droit `stream` sur `Flash`.
   *
   * `client.data.user` est le payload du JWT (objet simple, `sub` = id de la session
   * AuthUser), pas une entité : on recharge donc la session en base pour connaître
   * son rôle et ses permissions, et pour refuser une session fermée ou un compte inactif.
   */
  private async assertAuthUser(user: AuthUser | any): Promise<AuthUser> {
    const sessionId: string | undefined =
      user instanceof AuthUser ? user.id : user?.sub ?? user?.id;
    if (!sessionId) {
      throw new UnauthorizedException(`Session introuvable`);
    }

    const authUser = await AuthUser.findOne({
      where: { id: sessionId },
      relations: { user: true, role: true, branch: true, targetBranch: true },
    });
    if (!authUser || !authUser.isActive) {
      throw new UnauthorizedException(`Session inactive ou introuvable`);
    }
    if (!authUser.user?.isActive) {
      throw new UnauthorizedException(`Compte inactif`);
    }

   
    return authUser;
  }

  private async resolveFlashService(authUser: AuthUser): Promise<FlashService> {
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId({ [REQUEST_AUTH_USER_KEY]: authUser }, contextId);
    return await this.moduleRef.resolve(FlashService, contextId, { strict: false });
  }



  
}

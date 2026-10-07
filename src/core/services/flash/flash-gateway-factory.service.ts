/* eslint-disable prettier/prettier */
import { PaginatedService } from '@app/typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flash } from 'src/core/entities/flash/flash.entity';
import { FlashService } from './flash.service';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { AbilityActionEnum, StatusFlashEnum } from 'src/core/definitions/enums';
import { AuditFlashService } from './audit-flash.service';

@Injectable()
export class FlashGatewayServiceFactory {
  constructor(
    @InjectRepository(Flash)
    private readonly repository: Repository<Flash>,
    private readonly moduleRef: ModuleRef,
  ) {}


   
 async createRecord(authUser: AuthUser, payload: any): Promise<any> {
     const newflash  = (await this.resolveFlashService(authUser)).createRecord(payload as any);
    return await newflash;
  }

 async readRecord(authUser: AuthUser, payload: any): Promise<any> {
     const newflash  = (await this.resolveFlashService(authUser)).readOneRecord({where: payload, order: {timestamp: 'DESC'}} as any);
    return await newflash;
  }

  async updateRecord(authUser: AuthUser, optionsWhere: any, dto: any): Promise<any> {
    const updatedFlash = (await this.resolveFlashService(authUser)).updateRecord(optionsWhere, dto as any);
    return await updatedFlash;
  }
 async purgeOldPreviousFlash(authUser: AuthUser,  dto: any): Promise<any> {
    const updatedFlash = (await this.resolveFlashService(authUser)).purgeOldPreviousFlash(dto.station, dto.branch);
    return await updatedFlash;
  }



  


  private async resolveFlashService(authUser: AuthUser): Promise<FlashService> {
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId({ [REQUEST_AUTH_USER_KEY]: authUser }, contextId);
    return await this.moduleRef.resolve(FlashService, contextId, { strict: false });
  }



  
}

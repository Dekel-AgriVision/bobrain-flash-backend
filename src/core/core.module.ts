import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthUser } from './entities/session/auth-user.entity';
import { AccessRequestHistory } from './entities/session/access-request-history.entity';
import { AuthLog } from './entities/session/auth-log.entity';
import { Role } from './entities/user/role.entity';
import { UserController } from './controllers/user/user.controller';
import { RoleController } from './controllers/user/role.controller';
import { BranchController } from './controllers/subsidiary/branch.controller';
import { UserService } from './services/user/user.service';
import { AuthLogService } from './services/session/auth-log.service';
import { RoleService } from './services/user/role.service';
import { AuthUserService } from './services/session/auth-user.service';
import { Branch } from './entities/subsidiary/branch.entity';
import { BranchService } from './services/subsidiary/branch.service';
import { User } from './entities/user/user.entity';
import { DefaultDataService } from './services/system/default-data.service';
import { ModuleRef } from '@nestjs/core';
import { AccessService } from './services/user/access.service';
import { AccessController } from './controllers/user/access.controller';
import { ConfigService } from './services/system/config.service';
import { RunInTransactionService } from './services/transaction/runInTransaction.service';
import { Access } from './entities/user/access.entity';
import { BranchToUser } from './entities/subsidiary/branch-to-user.entity';
import { Flash } from './entities/flash/flash.entity';
import { FlashService } from './services/flash/flash.service';
import { FlashController } from './controllers/flash/flash.controller';
import { FlashSubscriber } from './services/flash/flash.subscriber';
import { Station } from './entities/setting/station.entity';
import { StationService } from './services/setting/station.service';
import { StationController } from './controllers/setting/station.controller';
import { ScheduleService } from './services/flash/schedule.service';
import { FlashServiceFactory } from './services/flash/flash-factory.service';
import { StationServiceFactory } from './services/flash/station-factory.service';
import { StationActivity } from './entities/setting/station-activity.entity';
import { StationActivityService } from './services/setting/station-activity.service';
import { StationActivityController } from './controllers/setting/station-activity.controller';
import { StationActivityFactoryService } from './services/setting/station-activity-factory.service';
import { Setting } from './entities/setting/setting.entity';
import { SettingController } from './controllers/setting/setting.controller';
import { SettingService } from './services/setting/setting.service';
import { ErpConnection } from './entities/setting/erp-connection.entity';
import { ErpConnectionService } from './services/setting/erp-connection.service';
import { ErpConnectionController } from './controllers/setting/erp-connection.controller';
import { ErpConnService } from './services/setting/erp-conn.service';
import { FlashGatewayServiceFactory } from './services/flash/flash-gateway-factory.service';
import { AuditFlashService } from './services/flash/audit-flash.service';
import { AuditFlash } from './entities/flash/audit-flash.entity';
import { AuditFlashController } from './controllers/flash/audit-flash.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessRequestHistory,
      Access,
      AuthLog,
      AuthUser,
      User,
      Role,
      Branch,
      BranchToUser,
      Flash,
      Station,
      StationActivity,
      Setting,
      ErpConnection,
      AuditFlash
    ]),
  ],
  controllers: [
    UserController,
    RoleController,
    AccessController,
    BranchController,
    FlashController,
    AuditFlashController,
    StationController,
    StationActivityController,
    SettingController,
    ErpConnectionController,
  ],
  providers: [
    RunInTransactionService,
    UserService,
    AuthUserService,
    AuthLogService,
    RoleService,
    AccessService,
    BranchService,
    ConfigService,
    DefaultDataService,
    FlashService,
    FlashSubscriber,
    StationService,
    ScheduleService,
    FlashServiceFactory,
    StationServiceFactory,
    StationActivityService,
    StationActivityFactoryService,
    SettingService,
    RunInTransactionService,
    ErpConnectionService,
    ErpConnService,
    FlashGatewayServiceFactory,
    AuditFlashService,
  ],
  exports: [
    TypeOrmModule,
    UserService,
    AuthUserService,
    AuthLogService,
    RunInTransactionService,
    FlashService,
    FlashServiceFactory,
    ScheduleService,
    ErpConnectionService,
    ErpConnService,
    FlashGatewayServiceFactory,
    AuditFlashService,
  ],
})
export class CoreModule implements OnApplicationBootstrap {
  constructor(private moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    console.log(`*** [${CoreModule.name}][onApplicationBootstrap] start`);
    const defaultDataService = this.moduleRef.get(DefaultDataService);
    defaultDataService
      .createDefaultData()
      .then((result) => {
        console.log(
          `*** [${CoreModule.name}][onApplicationBootstrap] default data created =>`,
          result,
        );
      })
      .catch((error) => {
        console.error(
          `*** [${CoreModule.name}][onApplicationBootstrap] default data creating failed`,
          error,
        );
      });
  }
}

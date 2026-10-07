/* eslint-disable prettier/prettier */
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { configs } from './config';
import { AppController } from './app.controller';
import {
  AllExceptionsFilter,
  LoggerModuleOptions,
  LOGGER_MODULE_OPTIONS,
  LoggingInterceptor,
  CustomValidationPipe,
  CustomLoggerModule,
} from '@app/nestjs';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CacheConfigService,
  TypeOrmDatabaseConfigService,
} from './config/services';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaginationModule } from '@app/typeorm';
import { RequestIssuerGuard } from './modules/auth/guards/request-issuer.guard';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Scope, Module } from '@nestjs/common';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { GatewayModule } from './gateway/gateway.module';
import { EventEmitterModule } from '@nestjs/event-emitter';



@Module({
  imports: [
    CustomLoggerModule.register({
      isGlobal: true,
      replacementRules: [
        { rule: 'x-user-claims' },
        { rule: 'cookie' },
        { rule: 'authorization' },
        { rule: 'jwt' },
        { rule: 'token' },
        { rule: 'password' },
        { rule: 'currentPassword' },
        { rule: 'confirmPassword' },
        { rule: 'newPassword' },
        { rule: 'secret' },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: configs,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmDatabaseConfigService,
    }),
    CacheModule.registerAsync({
      useClass: CacheConfigService,
      isGlobal: true,
    }),
    { module: CoreModule, global: true },
    { module: AuthModule, global: true },
    //{ module: MailModule, global: true },
    { module: PaginationModule, global: true },
    { module: GatewayModule, global: true },
    //{ module: ScheduleModule, global: true }
   
  ],
  controllers: [AppController],
  providers: [
    /**
     * Start filters
     */
    {
      provide: APP_FILTER,
      useFactory: (loggerModuleOptions?: LoggerModuleOptions) => {
        return new AllExceptionsFilter({ loggerModuleOptions });
      },
      inject: [LOGGER_MODULE_OPTIONS],
    },
    // End filters

    /**
     * Start guards
     * Order matters
     */
    {
      provide: APP_GUARD,
      useClass: RequestIssuerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // End guards

    /**
     * Start interceptors
     */
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useFactory: (loggerModuleOptions: LoggerModuleOptions) => {
        return new LoggingInterceptor({
          loggerModuleOptions,
          excludes: [
            /* { rule: '/api/v1/alive', response: false },
            {
              rule: { path: '/api/v1/alive', method: RequestMethod.GET }
            }, */
          ],
        });
      },
      inject: [LOGGER_MODULE_OPTIONS],
    },
    // End interceptors

    /**
     * Start pipes
     */
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    // End pipes
  ],
})
export class AppModule {}

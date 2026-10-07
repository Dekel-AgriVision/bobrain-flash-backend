import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common/decorators/core';

@Injectable()
export class TypeOrmDatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}
  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get<string>('db.host'),
      port: this.configService.get<number>('db.port'),
      username: this.configService.get<string>('db.username'),
      password: this.configService.get<string>('db.password'),
      database: this.configService.get<string>('db.name'),
      autoLoadEntities: true,
      supportBigNumbers: true,
      logging: ['error', 'warn'],
      charset: 'utf8mb4_unicode_ci',
      retryAttempts: 3,
      retryDelay: 5000, // milliseconds
      synchronize: process.env.NODE_ENV !== 'production', // TODO: Remove to production
      // synchronize: false,
    };
  }
}

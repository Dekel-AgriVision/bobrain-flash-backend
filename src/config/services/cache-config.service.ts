import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions<Record<string, any>> {
    const options: CacheModuleOptions<Record<string, any>> = {
      ttl: this.configService.get<number>('cache.ttl', 600),
    };

    return options;
  }
}

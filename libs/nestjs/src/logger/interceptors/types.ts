import { RouteInfo } from '@nestjs/common/interfaces';
import { LoggerModuleOptions } from '../types';

export interface LoggingInterceptorOptions {
  loggerModuleOptions?: LoggerModuleOptions;
  excludes?: LoggerInterceptorExcludeOptions[];
}

interface LoggerInterceptorExcludeOptions {
  rule: string | RouteInfo;
  request?: boolean;
  response?: boolean;
}


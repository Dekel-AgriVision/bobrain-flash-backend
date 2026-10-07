import { ModuleMetadata } from '@nestjs/common';
import { LoggerReplacementRuleOptions } from '@app/core';

export interface LoggerModuleOptions {
  isGlobal?: boolean;
  replacementRules?:
    | LoggerReplacementRuleOptions
    | LoggerReplacementRuleOptions[];
}

export interface LoggerModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
  inject?: any[];
  isGlobal?: boolean;
}

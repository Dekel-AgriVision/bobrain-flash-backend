import { ConfigurableModuleBuilder } from '@nestjs/common';
import { LoggerModuleOptions } from './types';

export const {
  ConfigurableModuleClass: ConfigurableCustomLoggerModuleClass,
  MODULE_OPTIONS_TOKEN: LOGGER_MODULE_OPTIONS,
} = new ConfigurableModuleBuilder<LoggerModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();

import { Module } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';
import { Logger4jsService } from './logger4js.service';
import { ConfigurableCustomLoggerModuleClass } from './custom-logger.module-definition';
import { LOGGER_MODULE_OPTIONS } from './custom-logger.module-definition';

@Module({
  providers: [
    Logger4jsService,
    CustomLogger,
    {
      provide: LOGGER_MODULE_OPTIONS,
      useValue: {},
    },
  ],
  exports: [Logger4jsService, CustomLogger, LOGGER_MODULE_OPTIONS],
})
export class CustomLoggerModule extends ConfigurableCustomLoggerModuleClass {}

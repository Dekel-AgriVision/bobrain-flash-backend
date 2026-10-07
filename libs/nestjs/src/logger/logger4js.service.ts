import {
  Inject,
  Injectable,
  LoggerService,
  Optional,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CONTEXT, RequestContext } from '@nestjs/microservices';
import { Request } from 'express';
import { LoggerModuleOptions } from './types';
import { Level } from 'log4js';
import { Logger4js } from '@app/core';
import { LOGGER_MODULE_OPTIONS } from './custom-logger.module-definition';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger4jsService extends Logger4js implements LoggerService {
  @Inject(REQUEST) private request: Request;
  @Inject(CONTEXT) private ctx: RequestContext;
  @Optional()
  @Inject(LOGGER_MODULE_OPTIONS)
  private loggerOptions?: LoggerModuleOptions;

  constructor(
    @Optional() context?: string,
    @Optional() _loggerOptions?: LoggerModuleOptions,
  ) {
    super();
    if (typeof context === 'string' && context.length > 0) {
      this.setContext(context);
    }
    if (_loggerOptions) {
      this.loggerOptions = _loggerOptions;
    }
  }

  setContext(context: string): void {
    this.addContext('name', context);
  }

  // Before log hook
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onBeforeLog(_level: Level, ..._args: any[]): void {
    this.updateOptions(this.loggerOptions);
    this._setRequestDataContext();
  }

  private _setRequestDataContext(): void {
    try {
      if (
        typeof this.ctx !== 'undefined' &&
        typeof this.ctx.context !== 'undefined'
      ) {
        this.addContext('requestContext', this.ctx.pattern);
      } else {
        if (typeof this.request !== 'undefined') {
          const requestId =
            this.request?.query?.MatchingKey ??
            this.request?.query?.requestId ??
            this.request?.header('X-OAPI-Request-Id') ??
            undefined;
          if (requestId !== undefined) {
            this.addContext('requestId', requestId);
          } else {
            this.removeContext('requestId');
          }

          const requestPath = this.request?.path ?? this.request?.url ?? '';

          this.addContext(
            'requestPath',
            `${this.request?.method?.toUpperCase()} ${requestPath}`,
          );
        }
      }
    } catch (e) {
      console.error(
        `[${new Date().toISOString()}][${
          Logger4jsService.name
        }][method][_setRequestDataContext]`,
        e,
      );
    }
  }
}

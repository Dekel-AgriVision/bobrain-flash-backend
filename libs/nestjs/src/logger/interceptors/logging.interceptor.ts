import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Optional,
  RequestMethod,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import pathToRegexp, { ParseOptions, RegExpOptions } from 'path-to-regexp';
import { Logger4jsService } from '../logger4js.service';
import { LoggingInterceptorOptions } from './types';
import { toBoolean } from '@app/core';

/**
 * Available environment variables:
 *  - APP_EXCEPTION_FILTER_LOG
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger: Logger4jsService;
  private _options: LoggingInterceptorOptions;
  private _requestPath: string;

  constructor(@Optional() options?: LoggingInterceptorOptions) {
    this.logger = new Logger4jsService(
      LoggingInterceptor.name,
      options?.loggerModuleOptions,
    );
    this._options = options ?? {};
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> | Observable<any> {
    const req: Request = context.switchToHttp().getRequest();

    this._updateRequestContextData(context);
    if (!this._isExcluded(req, 'request')) {
      // Log incoming request
      this._logRequest(context);
    }

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          if (!this._isExcluded(req, 'response')) {
            // Log outgoing response
            this._logResponse(data, context);
          }
        },
        error: (err) => {
          // Log error
          if (
            !this._isExcluded(req, 'response') &&
            toBoolean(process.env.APP_EXCEPTION_FILTER_LOG, false) !== true
          ) {
            this._logError(err, context);
          }
        },
      }),
    );
  }

  private _logRequest(context: ExecutionContext): void {
    const req: Request = context.switchToHttp().getRequest();
    this.logger.addContext('loggingLabel', 'INCOMING REQUEST');
    const { url, headers, body } = req;
    this.logger.log({ url, headers, body });
    this.logger.removeContext('loggingLabel');
  }

  private _logResponse(body: unknown, context: ExecutionContext): void {
    const res: Response = context.switchToHttp().getResponse();
    const { statusCode } = res;
    this.logger.addContext('loggingLabel', 'OUTGOING RESPONSE');
    this.logger.addContext('responseStatusCode', statusCode);
    if (statusCode >= HttpStatus.AMBIGUOUS) {
      this.logger.mark({ headers: res.getHeaders(), body });
    } else {
      this.logger.log({ headers: res.getHeaders(), body });
    }
    this.logger.removeContext('loggingLabel');
    this.logger.removeContext('responseStatusCode');
  }

  private _logError(error: Error, context: ExecutionContext): void {
    const res: Response = context.switchToHttp().getResponse();
    const headers = res.getHeaders();
    this.logger.addContext('loggingLabel', 'ERROR');
    if (error instanceof HttpException) {
      const statusCode: number = error.getStatus();
      this.logger.addContext('responseStatusCode', statusCode);
      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error({ headers }, error.stack);
      } else {
        this.logger.warn({ headers }, error.stack);
      }
    } else {
      this.logger.addContext('responseStatusCode', 500);
      this.logger.error({ headers }, error.stack);
    }
    this.logger.removeContext('loggingLabel');
    this.logger.removeContext('responseStatusCode');
  }

  private _updateRequestContextData(context: ExecutionContext): void {
    const req: Request = context.switchToHttp().getRequest();
    const requestId =
      req?.query?.MatchingKey ??
      req?.query?.requestId ??
      req?.header('X-OAPI-Request-Id') ??
      undefined;
    if (requestId !== undefined) {
      this.logger.addContext('requestId', requestId);
    } else {
      this.logger.removeContext('requestId');
    }

    this._requestPath = req?.path ?? req?.url ?? '';
    this.logger.addContext('requestPath', req.method + ' ' + this._requestPath);
  }

  private _isExcluded(req: Request, scope?: 'request' | 'response'): boolean {
    const excludes = this._options?.excludes ?? [];
    const method:
      | 'HEAD'
      | 'GET'
      | 'POST'
      | 'PATCH'
      | 'DELETE'
      | 'OPTIONS'
      | 'ALL' = req.method.toUpperCase() as any;

    const pathToRegOptions: ParseOptions & RegExpOptions = {
      start: false,
      end: true,
      strict: true,
    };
    let regExcludeObject: { pattern: RegExp; method: RequestMethod };
    let isExcluded = false;
    for (const exclude of excludes) {
      isExcluded = false;
      exclude.request = exclude.request ?? true;
      exclude.response = exclude.request ?? true;

      regExcludeObject = {} as any;

      if (typeof exclude.rule === 'string') {
        regExcludeObject.pattern = pathToRegexp(
          exclude.rule,
          undefined,
          pathToRegOptions,
        );
        regExcludeObject.method = RequestMethod.ALL;
      } else {
        regExcludeObject.pattern = pathToRegexp(
          exclude.rule.path,
          undefined,
          pathToRegOptions,
        );
        regExcludeObject.method = exclude.rule.method;
      }

      if (regExcludeObject.pattern.test(this._requestPath ?? '')) {
        if (regExcludeObject.method === RequestMethod.ALL) isExcluded = true;
        if (regExcludeObject.method === RequestMethod[method])
          isExcluded = true;
      }

      // Exclude from request/response
      if (isExcluded) {
        if (scope === 'request' && exclude.request === false) continue;
        if (scope === 'response' && exclude.response === false) continue;
        return isExcluded;
      }
    }
    return isExcluded;
  }
}

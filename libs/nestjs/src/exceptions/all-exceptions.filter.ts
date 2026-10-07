import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  MethodNotAllowedException,
  NotAcceptableException,
  NotFoundException,
  Optional,
  PayloadTooLargeException,
  PreconditionFailedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { toBoolean } from '@app/core';
import { startCase } from 'lodash';
import * as ErrorCode from './error-code';
import { InvalidBodyFieldException } from './invalid-body-field.exception';
import { LockedException } from './locked.exception';
import { Logger4jsService } from '../logger';
import { AllExceptionsFilterOptions } from './types';

/**
 * Available environment variables:
 *  - APP_EXCEPTION_FILTER_LOG
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private logger: Logger4jsService;

  constructor(@Optional() options?: AllExceptionsFilterOptions) {
    super();
    this.logger = new Logger4jsService(
      AllExceptionsFilter.name,
      options.loggerModuleOptions,
    );
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const error: HttpResponseError = new HttpResponseError();
    error.code = this.getErrorCodeByException(exception, status);
    error.message = 'Internal error';
    error.description = error.message;
    error.infoURL = `https://developer.mozilla.org/docs/Web/HTTP/Status/${status}`;
    error.errors = [];

    if (exception instanceof HttpException) {
      error.description = exception.message;
      const exceptionErrorResponse: any = exception.getResponse();
      error.message =
        exceptionErrorResponse.error ||
        exceptionErrorResponse.description ||
        startCase(exception.name);
      const errors = exceptionErrorResponse.message || [];
      if (Array.isArray(errors)) {
        // Permute error property
        const errorMessage = error.message;
        error.message = error.description;
        error.description = errorMessage;

        if (errors.length > 0) {
          if (typeof errors[0] === 'string') {
            error.errors = errors;
          } else {
            error.errors = errors[0];
          }
        }
      }
    }

    error.timestamp = new Date().toISOString();

    if (toBoolean(process.env.APP_EXCEPTION_FILTER_LOG, false) === true) {
      this._loggerException(status, error, exception, ctx);
    }

    return response.status(status).json(error);
  }

  private _loggerException(
    statusCode: number,
    response: HttpResponseError,
    exception: any,
    ctx: HttpArgumentsHost,
  ): void {
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const headers = res.getHeaders();

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

    const requestPath = req?.path ?? req?.url ?? '';
    this.logger.addContext('requestPath', req.method + ' ' + requestPath);
    this.logger.addContext('responseStatusCode', statusCode);
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ headers }, response, exception.stack || exception);
    } else {
      this.logger.warn({ headers }, response, exception.stack || exception);
    }
  }

  protected getErrorCodeByException(exception: any, status?: number): number {
    let code: number;
    if (exception instanceof InvalidBodyFieldException) {
      code = ErrorCode.INVALID_BODY_FIELD;
    } else if (
      exception instanceof BadRequestException ||
      status === HttpStatus.BAD_REQUEST
    ) {
      code = ErrorCode.BAD_REQUEST;
    } else if (
      exception instanceof UnauthorizedException ||
      status === HttpStatus.UNAUTHORIZED
    ) {
      code = ErrorCode.UNAUTHORIZED;
    } else if (
      exception instanceof ForbiddenException ||
      status === HttpStatus.FORBIDDEN
    ) {
      code = ErrorCode.FORBIDDEN;
    } else if (
      exception instanceof NotFoundException ||
      status === HttpStatus.NOT_FOUND
    ) {
      code = ErrorCode.NOT_FOUND;
    } else if (
      exception instanceof MethodNotAllowedException ||
      status === HttpStatus.METHOD_NOT_ALLOWED
    ) {
      code = ErrorCode.METHOD_NOT_ALLOWED;
    } else if (
      exception instanceof NotAcceptableException ||
      status === HttpStatus.NOT_ACCEPTABLE
    ) {
      code = ErrorCode.NOT_ACCEPTABLE;
    } else if (
      exception instanceof RequestTimeoutException ||
      status === HttpStatus.REQUEST_TIMEOUT
    ) {
      code = ErrorCode.REQUEST_TIMEOUT;
    } else if (
      exception instanceof ConflictException ||
      status === HttpStatus.CONFLICT
    ) {
      code = ErrorCode.CONFLICT;
    } else if (status === HttpStatus.LENGTH_REQUIRED) {
      code = ErrorCode.LENGTH_REQUIRED;
    } else if (exception instanceof PreconditionFailedException) {
      code = ErrorCode.PRECONDITION_FAILED;
    } else if (exception instanceof PayloadTooLargeException) {
      code = ErrorCode.PAYLOAD_TOO_LARGE;
    } else if (status === HttpStatus.URI_TOO_LONG) {
      code = ErrorCode.URI_TOO_LONG;
    } else if (exception instanceof UnsupportedMediaTypeException) {
      code = ErrorCode.UNSUPPORTED_MEDIA_TYPE;
    } else if (exception instanceof UnprocessableEntityException) {
      code = ErrorCode.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof LockedException) {
      code = ErrorCode.LOCKED;
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      code = ErrorCode.TOO_MANY_REQUESTS;
    } else if (exception instanceof BadGatewayException) {
      code = ErrorCode.BAD_GATEWAY;
    } else if (exception instanceof ServiceUnavailableException) {
      code = ErrorCode.SERVICE_UNAVAILABLE;
    } else {
      code = ErrorCode.INTERNAL_ERROR;
    }
    return code;
  }
}

export class HttpResponseError {
  @ApiProperty()
  code: number;
  @ApiProperty()
  message?: string;
  @ApiProperty()
  description?: string;
  @ApiProperty()
  timestamp: string;
  @ApiProperty()
  infoURL?: string;
  @ApiPropertyOptional()
  errors?: unknown;
}

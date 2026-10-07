import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  IS_PUBLIC_META_KEY,
  DEFAULT_APPLICATION_ID,
  REQUEST_APP_ID_HEADER,
  REQUEST_APP_KEY,
} from '../definitions/constants';
import { Application } from 'src/core/entities/session/application.entity';

@Injectable()
export class RequestIssuerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check public resource access
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_META_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as Request;

    // Check 'application-id' header
    const applicationId =
      (request.header(REQUEST_APP_ID_HEADER) as string) ??
      DEFAULT_APPLICATION_ID;

    // Add 'applicationId' to request object
    request[REQUEST_APP_KEY] = { id: applicationId } as Application;

    return true;
  }
}

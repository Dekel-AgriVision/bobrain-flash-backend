/**
 * Get current request authenticated user.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { REQUEST_AUTH_USER_KEY } from '../definitions/constants';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[REQUEST_AUTH_USER_KEY] as AuthUser;
  },
);

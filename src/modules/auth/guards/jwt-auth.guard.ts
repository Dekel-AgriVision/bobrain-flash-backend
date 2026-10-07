import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ANONYMOUS_META_KEY } from '../definitions/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check anonymous resource access
    const isAnonymous = this.reflector.getAllAndOverride<boolean>(
      IS_ANONYMOUS_META_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isAnonymous) {
      return true;
    }

    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (!user) {
      throw new UnauthorizedException(
        [{ token: [info?.message ?? err?.message] }],
        info?.message ?? err?.message,
      );
    }
    return super.handleRequest(err, user, info, context);
  }
}

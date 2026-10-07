import { AuthGuard } from '@nestjs/passport';
import _ from 'lodash';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthLog } from 'src/core/entities/session/auth-log.entity';
import { AuthLogService } from 'src/core/services/session/auth-log.service';
import { REQUEST_AUTH_LOG_KEY } from '../definitions/constants';
import { AuthLogAuthMethodEnum } from 'src/core/definitions/enums';
import { Logger4jsService } from '@app/nestjs';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  @Inject(AuthLogService)
  private authLogService: AuthLogService;

  @Inject(Logger4jsService)
  private logger: Logger4jsService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.setContext(LocalAuthGuard.name);
    this.logger.info(_.omit(request.body, ['password']), request.headers);

    // Throttle too many username login request
    const username: string = request.body?.username;

    await this.authLogService.throttleByUsername(
      request,
      AuthLogAuthMethodEnum.local,
      username,
    );

    // Log auth request and save 'authLog' object to app request
    request[REQUEST_AUTH_LOG_KEY] = await this.authLogService.createFromRequest(
      request,
      {
        username: username,
        authMethod: AuthLogAuthMethodEnum.local,
      },
    );

    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authLog = request[REQUEST_AUTH_LOG_KEY] as AuthLog;
    if (err) {
      // Update request 'authLog' with fail reason (err?.message)
      authLog.isDenied = true;
      authLog.denialReason = err?.message;
      authLog.save();
      this.logger.error(err?.message, err);
    } else if (!user) {
      // Update request 'authLog' with fail reason (info?.message)
      authLog.isDenied = true;
      authLog.denialReason = info?.message;
      authLog.save();
      throw new UnauthorizedException(
        [{ username: [info?.message] }],
        info?.message,
      );
    } else {
      // Update request 'authLog' as success
    }
    return super.handleRequest(err, user, info, context);
  }
}

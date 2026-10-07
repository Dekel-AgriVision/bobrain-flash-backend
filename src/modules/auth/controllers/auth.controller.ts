import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';
import {
  AUTH_USER_JWT_HEADER,
  REQUEST_AUTH_LOG_KEY,
  REQUEST_AUTH_USER_KEY,
} from '../definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { IsAnonymous } from '../decorators/is-anonymous.decorator';
import { AuthLog } from 'src/core/entities/session/auth-log.entity';
import { ApiAuthJwtHeader } from '../decorators/api-auth-jwt-header.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginConfirmResponseData } from '../classes/login-confirm-response.data';
import { LoginDto } from '../dto/login.dto';
import { CustomApiErrorResponse, Logger4jsService } from '@app/nestjs';
import { AuthUserSessionData } from 'src/core/classes/auth-user-session.data';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ApiRequestIssuerHeader } from '../decorators/api-request-issuer-header.decorator';

@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: Logger4jsService,
  ) {
    this.logger.setContext(AuthController.name);
  }

  /**
   * Authenticate user
   */
  @ApiBody({ type: LoginDto })
  @IsAnonymous()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() request: any): Promise<LoginConfirmResponseData> {
    try {
      return await this.authService.confirmLogin(
        request[REQUEST_AUTH_USER_KEY] as AuthUser,
      );
    } catch (e) {
      const authLog = request[REQUEST_AUTH_LOG_KEY] as AuthLog;
      if (authLog) {
        authLog.isDenied = true;
        authLog.denialReason = e?.message;
        authLog.save();
      }
      throw e;
    }
  }

  /**
   * Get authenticated user data
   */
  @ApiAuthJwtHeader()
  @Get('user')
  async user(@CurrentUser() authUser: AuthUser): Promise<AuthUserSessionData> {
    if (!authUser) {
      throw new UnauthorizedException(`Impossible de récupérer le session`);
    }
    return {
      session: authUser,
      abilities: await authUser.getAbililyRules(),
    };
  }

  /**
   * Refresh session token
   *
   * Renvoie un nouveau JWT pour la session courante, même si le token envoyé
   * (en-tête x-user-claims) a expiré depuis moins de APP_JWT_REFRESH_GRACE.
   * Refusé si la session est fermée, le compte inactif ou la session inactive
   * depuis plus de APP_JWT_INACTIVE_SESSION_TTL.
   */
  @ApiAuthJwtHeader()
  @IsAnonymous()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() request: any): Promise<LoginConfirmResponseData> {
    return await this.authService.refreshToken(
      request.headers?.[AUTH_USER_JWT_HEADER] as string,
    );
  }

  /**
   * Log out authenticated user
   */
  @ApiAuthJwtHeader()
  @HttpCode(HttpStatus.RESET_CONTENT)
  @Post('logout')
  async logout() {
    await this.authService.logout();
    return;
  }

  /**
   * Change session user password
   */
  @ApiAuthJwtHeader()
  @HttpCode(HttpStatus.RESET_CONTENT)
  @Post('change-password')
  async changePassword(@Req() request: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(dto);
    return;
  }

  /**
   * Switch current session branch to another targetted branch
   */
  @ApiAuthJwtHeader()
  @HttpCode(HttpStatus.OK)
  @Post('switch/:branchId')
  async switchToBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ): Promise<AuthUserSessionData> {
    const authUser = await this.authService.switchToBranch(branchId);
    return {
      session: authUser,
      abilities: await authUser.getAbililyRules(),
    };
  }
}

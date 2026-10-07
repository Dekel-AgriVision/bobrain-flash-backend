import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private moduleRef: ModuleRef) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    username: string,
    password: string,
  ): Promise<any> {
    const contextId = ContextIdFactory.getByRequest(request);
    const authService = await this.moduleRef.resolve(AuthService, contextId);
    try {
      const authUser: AuthUser = await authService.validateUser(
        username,
        password,
      );
      if (!authUser) {
        const invalidCredentialsMsg =
          "Nom d'utilisateur ou mot de passe incorrect";
        throw new UnauthorizedException(
          [
            {
              username: [invalidCredentialsMsg],
            },
          ],
          invalidCredentialsMsg,
        );
      }
      return authUser;
    } catch (exception) {
      throw exception;
    }
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import dayjs from 'dayjs';
import { CreateAuthLogFromRequestDto } from '../../../modules/auth/dto/create-auth-log-from-request.dto';
import { AuthLog } from '../../entities/session/auth-log.entity';
import { AuthLogAuthMethodEnum } from '../../definitions/enums';
import { REQUEST_APP_KEY } from 'src/modules/auth/definitions/constants';
import { Application } from '../../entities/session/application.entity';

@Injectable()
export class AuthLogService {
  constructor(
    @InjectRepository(AuthLog) private repository: Repository<AuthLog>,
    private configService: ConfigService,
  ) {}

  async createFromRequest(
    request: any,
    dto: CreateAuthLogFromRequestDto,
  ): Promise<AuthLog> {
    const application = request[REQUEST_APP_KEY] as Application;
    const authLog = this.repository.create({
      ...dto,
      applicationId: dto.applicationId ?? application?.id,
      username: dto.username ?? (request?.user as any)?.username,
      requestUrl: request.originalUrl,
      requestMethod: request.method,
      ipAddress: request.ip,
      userAgent: request.useragent,
    });

    return this.repository.save(authLog);
  }

  async throttleByUsername(
    request: any,
    authMethod: AuthLogAuthMethodEnum,
    username: string,
  ): Promise<void> {
    // Réactivé : protection contre la force brute (ADR-0005 / ADR-0018)
    const application = request[REQUEST_APP_KEY] as Application;
    const limit = this.configService.get<number>(
      'security.auth_throttle_limit',
      10,
    );
    const ttl = this.configService.get<number>('security.auth_throttle_ttl');
    const ttlDate = dayjs.utc().subtract(ttl, 'seconds');
    const attemptsCount = await this.repository.countBy({
      username: username,
      authMethod: authMethod,
      applicationId: application?.id,
      isDenied: true,
      createdAt: MoreThanOrEqual(ttlDate.toDate()),
    });

    if (attemptsCount >= limit) {
      throw new UnauthorizedException(
        [{ username: [`Trop de tentatives de connexion. Réessayez plus tard`] }],
        `Vous avez atteint le nombre maximum d'essais. Veuillez réessayer dans quelques minutes`,
      );
    }
  }
}

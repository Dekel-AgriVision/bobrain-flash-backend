import {
  ApiSearchOneParamOptions,
  ApiSearchOneQueryFilter,
  ApiSearchParamOptions,
  ApiSearchQueryFilter,
  CustomApiErrorResponse,
  CustomApiPaginatedResponse,
  Paginated,
} from '@app/nestjs';
import { buildFilterFromApiSearchParams } from '@app/typeorm';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { WeightLog } from 'src/core/entities/flash/weight-log.entity';
import { WeightDaily } from 'src/core/entities/flash/weight-daily.entity';
import {
  AuditFlashDetails,
  AuditFlashService,
  AuditFlashStats,
} from 'src/core/services/flash/audit-flash.service';

// Champs texte de weight_log (ADR-0022). statusMsg et les infos du poste
// (userName, computerName...) sont calculés ou stockés dans station_session.
const AUDIT_TEXT_FILTER_FIELDS = [
  'reference',
  'ticket',
  'station',
  'branch',
  'status',
  'frame',
];

//@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('audit-flash')
@Controller('audit-flash')
export class AuditFlashController {
  constructor(private service: AuditFlashService) {}

  private async checkRead(authUser: AuthUser) {
    await authUser?.throwUnlessCan(AbilityActionEnum.read, AbilitySubjectEnum.Flash);
  }

  /**
   * Historique paginé des pesées (table weight_log, ADR-0022)
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(WeightLog)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<WeightLog>> {
    await this.checkRead(authUser);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      { textFilterFields: AUDIT_TEXT_FILTER_FIELDS },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Historique paginé d'une station (codes surccusale / station)
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(WeightLog)
  @Get('station/:branch/:station')
  async findByStation(
    @CurrentUser() authUser: AuthUser,
    @Param('branch') branch: string,
    @Param('station') station: string,
    @Query() query?: any,
  ): Promise<Paginated<WeightLog>> {
    await this.checkRead(authUser);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      { textFilterFields: AUDIT_TEXT_FILTER_FIELDS },
    );
    options.where = Array.isArray(options.where) && options.where.length
      ? (options.where as any[]).map((w) => ({ ...w, branch, station }))
      : { ...(options.where as any), branch, station };

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Statistiques d'une station sur les `hours` dernières heures (défaut 24)
   */
  @ApiQuery({ name: 'hours', required: false, type: Number })
  @Get('station/:branch/:station/stats')
  async stationStats(
    @CurrentUser() authUser: AuthUser,
    @Param('branch') branch: string,
    @Param('station') station: string,
    @Query('hours') hours?: number,
  ): Promise<AuditFlashStats> {
    await this.checkRead(authUser);

    return this.service.readStationStats(branch, station, new Date(), Number(hours) || 24);
  }

  /**
   * Résumé journalier d'une station (weight_daily, conservé sans limite)
   */
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Nombre de jours (défaut 90)' })
  @Get('station/:branch/:station/daily')
  async stationDaily(
    @CurrentUser() authUser: AuthUser,
    @Param('branch') branch: string,
    @Param('station') station: string,
    @Query('days') days?: number,
  ): Promise<WeightDaily[]> {
    await this.checkRead(authUser);

    return this.service.readDaily(branch, station, Number(days) || 90);
  }

  /**
   * Détail enrichi d'un audit : précédent / suivant, chronologie de la station,
   * flash courant et statistiques sur `hours` heures (défaut 24).
   */
  @ApiQuery({ name: 'around', required: false, type: Number, description: "Nombre d'événements avant/après (défaut 10, max 50)" })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Fenêtre des statistiques en heures (défaut 24)' })
  @Get(':auditFlashId/details')
  async findDetails(
    @CurrentUser() authUser: AuthUser,
    @Param('auditFlashId', ParseIntPipe) id: string,
    @Query('around') around?: number,
    @Query('hours') hours?: number,
  ): Promise<AuditFlashDetails> {
    await this.checkRead(authUser);

    return this.service.readDetails(id, { around, periodHours: hours });
  }

  /**
   * Un audit flash par id
   */
  @ApiSearchOneQueryFilter()
  @Get(':auditFlashId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('auditFlashId', ParseIntPipe) id: string,
    @Query() query?: any,
  ): Promise<WeightLog> {
    await this.checkRead(authUser);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }
}

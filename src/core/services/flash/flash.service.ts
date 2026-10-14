import { PaginatedService } from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Flash } from 'src/core/entities/flash/flash.entity';
import { CreateFlashDto } from 'src/core/dto/flash/create-flash.dto';
import { Socket } from 'socket.io-client';
import { WeightLogWriterService } from './weight-log-writer.service';

@Injectable()
//implements OnModuleInit
export class FlashService extends AbstractService<Flash> {
  public NOT_FOUND_MESSAGE = `Flash non trouvée`;
  private socket: Socket;
  private authUser: any;

  constructor(
    @InjectRepository(Flash)
    private _repository: Repository<Flash>,
    protected paginatedService: PaginatedService<Flash>,
    private readonly weightLogWriter: WeightLogWriterService,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  sendToERP(data: any) {
    this.socket.emit('forwarded-message', { status: 'success', data });
  }

  async readOneWeight2(options?: any) {
    const entity = await this.repository.findOneBy(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    if (!entity.frame) {
      throw new BadRequestException(
        `Verifiez le port de connexion ou l'afficheur  ${entity.station}`,
      );
    }
    if (entity.sentWeight <= 0) {
      throw new BadRequestException(
        `Poids est inferieur ou égale à zéro  ${entity.station}`,
      );
    }
    const newData = {
      weight: entity.sentWeight,
      trame: entity.frame,
      date: entity.createdAt,
      ...entity,
    };

    return newData as any;
  }

  async readOneWeight(options?: any) {
    const entity = await this.repository.findOneBy(options);
    if (entity === null) {
      throw new BadRequestException(
        `Accès réfusé à la station ${options.station} de la branche ${options.branch}. transaction n'existe pas encore dans la base`,
      );
    }
    if (!entity.frame) {
      throw new BadRequestException(
        `Accès réfusé à la station ${entity.station} de la branche ${entity.branch}. Vérifiez le port ou l'afficheur`,
      );
    }

    if (entity.sentWeight <= 0) {
      throw new BadRequestException(
        `Poids invalide ≤ 0 (${entity.station}) de la branche ${entity.branch} poids = ${entity.sentWeight}  status(${entity.status})`,
      ); // Ajout de la valeur du poids pour le debug
    }

    return {
      ...entity,
      weight: entity.sentWeight,
      trame: entity.frame,
      date: entity.createdAt,
      status: entity.status,
      station: entity.station,
      branch: entity.branch,
      latency: entity.latency,
    } as any;
  }

  async createRecord(dto: CreateFlashDto) {
    const res = await super.createRecord(dto);
    // Journal des pesées : mise en file, écriture groupée et dédoublonnée (ADR-0022).
    // N'attend pas la base : la réponse au poste n'est plus ralentie par l'historique.
    this.weightLogWriter?.record(res as any);
    return res;
  }

   async updateRecord(optionsWhere: any, dto: CreateFlashDto): Promise<any> {
    return await super.updateRecord(optionsWhere, dto) as any;
  }

  /**
   * Ne garde que le flash courant d'une station.
   * Avec `keepCreatedAt` (cas normal, ADR-0022) : un DELETE simple sur l'index (branch, station),
   * au lieu du `NOT IN (SELECT ... ORDER BY ... LIMIT)` exécuté à chaque trame.
   */
  async purgeOldPreviousFlash(station: string, branch: string, keep = 1, keepCreatedAt?: Date | string) {
    if (keepCreatedAt) {
      // On ne supprime que les flashs PLUS ANCIENS que celui qui vient d'être enregistré :
      // deux trames concurrentes de la même station ne peuvent pas s'effacer mutuellement.
      // Un verrou mortel (deadlock) est rejoué une fois, puis ignoré : la trame suivante purgera.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await Flash.query(
            `DELETE FROM flash WHERE branch = ? AND station = ? AND created_at < ?`,
            [branch, station, new Date(keepCreatedAt)],
          );
        } catch (e) {
          if (!/deadlock|lock wait/i.test(e?.message ?? '')) throw e;
        }
      }
      return null;
    }
    return await Flash.query(
      `
      DELETE FROM flash
      WHERE station = ?
      AND branch = ?
      AND id NOT IN (
          SELECT id FROM (
              SELECT id
              FROM flash
              WHERE station = ?
              AND branch = ?
              ORDER BY created_at DESC
              LIMIT ?
          ) AS t
      )
      `,
      [station, branch, station, branch, keep]
    );
}



  get repository(): Repository<Flash> {
    return this._repository;
  }
}

/* eslint-disable prettier/prettier */
import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { eventReasonActivityFlashEnum, eventReasonCodeActivityFlashEnum, StatusFlashEnum } from 'src/core/definitions/enums';
import { Station } from 'src/core/entities/setting/station.entity';
import { FlashServiceFactory } from './flash-factory.service';
import { EventEmitter2 } from 'eventemitter2';
import { Flash } from 'src/core/entities/flash/flash.entity';
import { Branch } from 'src/core/entities/subsidiary/branch.entity';
import { Setting } from 'src/core/entities/setting/setting.entity';

// flash-background.service.ts
@Injectable() // ✅ Singleton - pas d'AbstractService ici
export class ScheduleService implements OnApplicationBootstrap, OnModuleDestroy {
  private running = true;
  
  constructor(
    private readonly flashFactory: FlashServiceFactory,

    private readonly eventEmitter: EventEmitter2,
    
  ) {}


  private readonly isConcernedStatus = new Set([
    StatusFlashEnum.SERVICE_SHUTDOWN,
    StatusFlashEnum.SERIAL_DISCONNECTED,
    //StatusFlashEnum.STALE,
    StatusFlashEnum.DESABLE_STATION
  ]);

  async onApplicationBootstrap() {
     try {
      const branches = await Branch.find();
      for (const branch of branches) {
        this.startLoop(branch.id).catch((err) => {
          console.error(`Erreur loop branch ${branch.code}:`, err);
        });
      }
  } catch (error) {
    console.error('Erreur au démarrage:', error);
  }
  }
  

  onModuleDestroy() {
    this.running = false;
  }

  async startLoop(branchId:string) {
    while (this.running) {
      try {
        const stations: any = await Station.find({
        where: {
          branchId: branchId,
        },
        });
        for (const st of stations) {
          try {
            await this.checkStationStatusWeight(st.code)
          } catch (err) {
          }
        }
      } catch (error) {
        console.error('Erreur dans la boucle principale:', error);
      }

      await this.sleep(2000);
    }
  }

   isBlocked(status: StatusFlashEnum): boolean {
    return this.isConcernedStatus.has(status);
  }



  private async checkStationStatusWeight(station: string) {

  const staledelay = await Setting.findOneBy({name: process.env.MAX_DELAY_STALE_DELAY});
  const stopdelay = await Setting.findOneBy({name: process.env.MAX_DELAY_STALE_TO_SHUTDOWN_DELAY});

  const STALE_DELAY = parseInt(staledelay.value) || 3000;
  const SHUTDOWN_DELAY = parseInt(stopdelay.value) 
  const flash = await this.flashFactory.create().readOneRecord({
    where: { station: station },
    order: { timestamp: 'DESC' },
  });

  if (!flash) return;

  // ⚠️ on bloque seulement certains états (pas STALE)
  if (this.isBlocked(flash.status as StatusFlashEnum)) return;

  let timestamp = flash.timestamp;

  if (timestamp < 1e12) {
    timestamp = timestamp * 1000;
  }

  const delay = Date.now() - timestamp;

  // ============================
  // 1. PASSAGE EN STALE
  // ============================
const alreadyStaleOrEmpty = (flash.status === StatusFlashEnum.STALE || flash.status === StatusFlashEnum.BRIDGE_EMPTY ||flash.status === StatusFlashEnum.DISPLAY_ON || flash.status === StatusFlashEnum.DISPLAY_OFF || flash.status === StatusFlashEnum.SERVICE_SHUTDOWN );
if (!alreadyStaleOrEmpty && delay > STALE_DELAY) {
    await this.flashFactory.create().repository.update(
      { id: flash.id, branch: flash.branch },
      {
        status: StatusFlashEnum.STALE,
        sentWeight: 0,
        latency: delay as any,
        isMonitored:false
      },
    );

    const _flash = await this.flashFactory.create().readOneRecord({
      where: { id: flash.id },
    });

    this.eventEmitter.emit('stale_flash.updated', {
      ..._flash,
      reasoncode: eventReasonCodeActivityFlashEnum.STALE,
      reason: eventReasonActivityFlashEnum.STALE,
      isMonitored:false
    });

    return;
  }

  // ============================
  // 2. STALE → SERVICE_SHUTDOWN
  // ============================
  if (flash.status === StatusFlashEnum.STALE && delay > (STALE_DELAY + SHUTDOWN_DELAY)) {

    await this.flashFactory.create().repository.update(
      { id: flash.id, branch: flash.branch },
      {
        status: StatusFlashEnum.SERVICE_SHUTDOWN,
        isMonitored:false
      },
    );

    const _flash = await this.flashFactory.create().readOneRecord({
      where: { id: flash.id },
    });

    this.eventEmitter.emit('stale_flash.updated', {
      ..._flash,
      reasoncode: eventReasonCodeActivityFlashEnum.SERVICE_AUTO_SHUTDOWN_AFTER_STALE,
      reason:eventReasonActivityFlashEnum.SERVICE_AUTO_SHUTDOWN_AFTER_STALE,
    });
  }
}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

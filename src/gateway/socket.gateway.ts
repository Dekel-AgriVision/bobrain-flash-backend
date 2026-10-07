/* eslint-disable prettier/prettier */
// src/socket/socket.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Flash } from 'src/core/entities/flash/flash.entity';
import axios from 'axios';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { OnEvent } from '@nestjs/event-emitter';
import { Branch } from 'src/core/entities/subsidiary/branch.entity';
import { Station } from 'src/core/entities/setting/station.entity';
import { ActivityType, eventReasonActivityFlashEnum, eventReasonCodeActivityFlashEnum, SocketClientRWBEventEnum, SocketServertoClientBKOfficeEventEnum, SocketServerToERPClientEventEnum, STATUS_MAP, StatusFlashEnum } from 'src/core/definitions/enums';
import { StationActivity } from 'src/core/entities/setting/station-activity.entity';
import { RunInTransactionService } from 'src/core/services/transaction/runInTransaction.service';
import jwt, { JwtPayload } from "jsonwebtoken";

import { ErpConnService } from 'src/core/services/setting/erp-conn.service';
import { FlashGatewayServiceFactory } from 'src/core/services/flash/flash-gateway-factory.service';



@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer() server: Server;

  constructor(
    private readonly erpService: ErpConnService, // ✅ propre
    private readonly transactionService: RunInTransactionService,// remplace par ton secret en prod
    private readonly flashGatewayServiceFactory: FlashGatewayServiceFactory,
  ) {
      //console.log('🔥 Gateway instance created');
  }

  private erpSocket: ClientSocket | null = null;
  private erpToken: string | null = null;

  private  ERP_AUTH_URI: string;
  private  ERP_WS_URL: string;
  private  ERP_BASE_PORT: string ;
  private  ERP_LOGIN: string;
  private  ERP_PASSWORD: string ;
  private  ERP_WS_URI : string;
  private  ERP_URI : string
  private ERP_URL: string ;
  private ERP_LOGINURL: string ;
  private readonly JWT_SECRET = process.env.APP_JWT_SECRET; // remplace par ton secret en prod
 
  private ERP_BASE_URL : string ;
  private DEFAULT_WEIGHT : number= 0;


  private async loadErpConfig(branchCode: string) {
  const erp = await this.erpService.getConfig(branchCode);
  if (!erp) {
    console.warn(`Aucune config ERP pour branch ${erp}`);
    return;
  }

  this.ERP_BASE_URL = erp.baseUrl;
  this.ERP_BASE_PORT = erp.port?.toString();
  this.ERP_URI = erp.apiUri;
  this.ERP_AUTH_URI = erp.authUri;
  this.ERP_WS_URI = erp.wsUri;
  this.ERP_LOGIN = erp.login;
  this.ERP_PASSWORD = erp.password;

  // 🔥 construction propre sécurisée
  this.ERP_WS_URL = `${erp.baseUrl.replace(/\/$/, '')}:${erp.port}/${erp.wsUri?.replace(/^\//, '')}`;
  this.ERP_URL = `${erp.baseUrl}:${erp.port}/${erp.apiUri}`;
  this.ERP_LOGINURL = `${this.ERP_URL}/${erp.authUri}`;
  this.ERP_WS_URL = `${erp.baseUrl.replace(/\/$/, '')}:${erp.port}/${erp.wsUri?.replace(/^\//, '')}`;

}

private async connectToErp(newflash: any) {
  try {
    await this.loadErpConfig(newflash.branch); // 🔥 NEW

    await this.obtainErpTokenIfNeeded();

    if (!this.erpToken) {
      console.warn('Pas de token ERP');
      return;
    }

    if (this.erpSocket) {
      this.erpSocket.disconnect(); // 🔥 éviter doublon
    }
        
    this.erpSocket = io(this.ERP_WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      auth: { token: this.erpToken},
    });

    this.erpSocket.on('connect', () => {
      console.log(`✅ ERP connecté (${newflash.branch}  ${newflash.station})`);
      // 2) Forward vers ERP (si nécessaire) — non bloquant mais on peut tenter
      if (this.erpSocket && this.erpSocket.connected) {
          this.erpSocket.emit(SocketServerToERPClientEventEnum.NEW_ITEM_TO_ERP, newflash);
        } 
      });

    this.erpSocket.on('disconnect', () => {
      console.log(`❌ ERP déconnecté (${newflash.branch} ${newflash.station})`);
    });

  } catch (err) {
    console.error('Erreur connect ERP:', err.message);
  }
}

 
   
    afterInit(server: Server) {
    this.ERP_BASE_URL = process.env.API_ERP_BASE_URL;;
    this.ERP_AUTH_URI = process.env.API_ERP_AUTH_URI;
    this.ERP_BASE_PORT = process.env.API_ERP_BASE_PORT;
    this.ERP_URI = process.env.API_ERP_URI;
    this.ERP_LOGIN = process.env.API_ERP_LOGIN;
    this.ERP_PASSWORD = process.env.API_ERP_PASSWORD;
    this.ERP_WS_URI = process.env.ERP_WS_URI;
    
    this.ERP_WS_URL = `${this.ERP_BASE_URL}:${this.ERP_BASE_PORT}/${this.ERP_WS_URI}`;
    this.ERP_URL = `${this.ERP_BASE_URL}:${this.ERP_BASE_PORT}/${this.ERP_URI}`;
    this.ERP_LOGINURL = `${this.ERP_URL}/${this.ERP_AUTH_URI}`;
    // Middleware handshake: validate token existance & optionally JWT
   server.use((socket: any, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Auth token missing'));
    }

    try {
      const payload = jwt.verify(token, this.JWT_SECRET as string) as JwtPayload;
      socket.data.user = payload;
      socket.data.token = token;
      return next();

    } catch (jwtErr: any) {
      if (jwtErr instanceof jwt.TokenExpiredError) {
        // 👇 token expiré — jwtErr.expiredAt contient la date d'expiration
        console.error('Token EXPIRÉ le', jwtErr.expiredAt);
        return next(new Error('Token expired'));
      }
      if (jwtErr instanceof jwt.JsonWebTokenError) {
        // signature invalide / jwt malformed
        console.error('Token invalide:', jwtErr.message);
        return next(new Error('Invalid token'));
      }
      console.error('Erreur JWT:', jwtErr.message);
      return next(new Error('Invalid token'));
    }

      } catch (err: any) {
        console.error('Handshake error:', err.message);
        return next(new Error('Handshake error'));
      }
    });
      }

  handleConnection(client: Socket) {    
    this.server.emit(SocketServertoClientBKOfficeEventEnum.START_FLASH_BACKEND, { response: 'start_flash_backend', data: null });

    // Optionnel : initialiser connexion ERP la première fois (non bloquant)
    // on démarre une tentative de connexion au ERP si nécessaire (async fire-and-forget)
    /*if (!this.erpSocket || !this.erpSocket.connected) {
      this.connectToErp().catch((e) => {
          console.error('Impossible de se connecter immédiatement à l’ERP: ' + e.message);
      });
    }*/
  }
  

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected: ${client.id}`);
  }

 
@SubscribeMessage(SocketClientRWBEventEnum.SEND_WEIGHT)
async handleMessage( @MessageBody() data: unknown,@ConnectedSocket() client: Socket,): Promise<{ status: string; savedId?: number; message?: string }> {
  try {
    console.log('[sendWeight] Received data7:', data);
    const dt = this.parsePayload(data);

    const token = dt?.auth_token ?? client.data?.token;
    if (!token) {
      throw new Error('Unauthorized: token missing');
    }
    let ply=dt.payload
    if(ply.status==StatusFlashEnum.WEIGHT_OK || ply.status==StatusFlashEnum.WEIGHT_NOT_OK ||ply.status==StatusFlashEnum.BRIDGE_EMPTY){
      ply={...ply,isMonitored:true}
    }else{
     ply={...ply,isMonitored:false}
    }
    const saved = await this.saveAndForward(ply, token, client);

    if (!saved) {
      throw new Error('Save failed');
    }

     /*if (saved) {
        await this.connectToErp(saved); // 🔥 ici
      }*/

   
    


   
    // Traitements post-save (isolés pour lisibilité)
    await this.handlePostSave({...saved},client); // exemple de reason, adapte selon ton besoin
    // Emit global
    this.server.emit(SocketServertoClientBKOfficeEventEnum.SENT_NEW_FLASH, {
      response: 'sent_new_flash',
      data: saved,
    });

    // Emit client
    client.emit(SocketServertoClientBKOfficeEventEnum.SENT_WEIGHT_DATA, {
      status: 'success',
      data: saved,
    });

    return { status: 'ok', savedId: saved.id };

  } catch (err) {
    console.error('[sendWeight FULL ERROR]:', err);

  client.emit(SocketServertoClientBKOfficeEventEnum.SENT_WEIGHT_DATA, {
    status: 'error',
    message: err?.message ?? 'unknown error',
  });

  return { status: 'error', message: err?.message };
  }
}

private parsePayload(data: unknown): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      throw new Error('Invalid JSON payload');
    }
  }
  return data;
}

private getStatusMsg(status: StatusFlashEnum): string {
  return STATUS_MAP[status]?.label ?? status;
}

private async handlePostSave(saved: any, client: Socket): Promise<void> {
   await this.flashGatewayServiceFactory.purgeOldPreviousFlash(client.data.user as any, saved as any);

  if(saved.status == StatusFlashEnum.SERVICE_SHUTDOWN){  
     await this.stopActivity(saved.station, saved.branch,eventReasonCodeActivityFlashEnum.SERVICE_SHUTDOWN,eventReasonActivityFlashEnum.SERVICE_SHUTDOWN);
     return;
  }
   if( saved.status === StatusFlashEnum.SERIAL_DISCONNECTED){  
     await this.stopActivity(saved.station,saved.branch,eventReasonCodeActivityFlashEnum.SERIAL_DISCONNECTED,eventReasonActivityFlashEnum.SERIAL_DISCONNECTED);
     return;
  }

   if(saved.status===StatusFlashEnum.DESABLE_STATION){  
     await this.stopActivity(saved.station, saved.branch,eventReasonCodeActivityFlashEnum.DESABLE_STATION,eventReasonActivityFlashEnum.DESABLE_STATION);
     return;
  }
  await this.startActivity(saved.station, saved.branch,eventReasonCodeActivityFlashEnum.DISPLAY_ON,eventReasonActivityFlashEnum.DISPLAY_ON);
  
}
  // ---------- Exemple de sauvegarde + forward (adapter selon ta DB/service) ----------
private async saveAndForward(payload: any, token: string , client: Socket) {

  // 1) Sauvegarde locale via ton entity (Flash.save attend un objet JS)
  //    Ton code original faisait: const saved = await Flash.save(JSON.parse(data));
  //    Ici on s'attend à recevoir un objet
  try {
    // Si tu utilises ton service: await this.flashService.createRecord(payload);

    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    }
      return await this.processStationFlux(payload, token, client); // vérifie station/branche et bloque si nécessaire  
  } catch (dbErr) {
    console.error('Erreur sauvegarde Flash: ' + dbErr?.message);
    throw dbErr;
  } 

 
  /*try {
    // Si tu as besoin du token ERP, vérifie s'il est disponible, sinon tente une auth
    if (!this.erpToken) {
      await this.obtainErpTokenIfNeeded();
    }
    /*if (this.erpToken) {
      // Ex: POST vers API ERP
      console.log('Forward22',this.erpToken);
      try {
        await axios.post(`${process.env.ERP_API_URL ?? 'http://localhost:3335'}/api/receive`, saved, {
          headers: { Authorization: `Bearer ${this.erpToken}` },
          timeout: 5000,
        });
        console.log('Forward vers ERP réussi (HTTP).');
      } catch (httpErr) {
        console.warn('Forward vers ERP échoué (HTTP): ' + (httpErr?.message ?? httpErr));
        // Ne throw pas — on continue
      }
    }

    // Optionnel: forward via socket à un namespace ERP
    if (this.erpSocket && this.erpSocket.connected) {
      this.erpSocket.emit('new_Item_to_erp', saved);
    }
  } catch (forwardErr) {
    console.log('Erreur forward: ' + forwardErr?.message ?? forwardErr);
  }*/

  // NE PAS déconnecter le client ici ! On laisse la connexion ouverte pour de futurs envois.
}

  // ---------- Helpers pour ERP ----------
private async obtainErpTokenIfNeeded() {

  if (this.erpToken) {
    return this.erpToken;
  }
  if (!this.ERP_LOGIN || !this.ERP_PASSWORD) {

   this.erpToken= await axios.post(this.ERP_LOGINURL, {
      username:  this.ERP_LOGIN,
      password:  this.ERP_PASSWORD,
    }, { timeout: 5000 }).then(resp=>resp?.data?.token ?? null).catch(err=>{
      console.warn('Erreur auth ERP: ' + (err?.message ?? err));
      return null;
    });

  }
   
  try {
    const resp = await axios.post(this.ERP_LOGINURL, {
     username:  this.ERP_LOGIN,
      password:  this.ERP_PASSWORD,
    }, { timeout: 5000 });
    this.erpToken = resp?.data?.token ?? null;
    return this.erpToken;
  } catch (err) {
    console.warn('Erreur auth ERP2: ' + (err?.message ?? err));
    return null;
  }
}



async processStationFlux(payload: any, token: string, client: any): Promise<any | null> {
    // 1. Récupérer la branche
  const branch = await Branch.findOneBy({
    code: payload.branch,
  });

  if (!branch) {
    console.warn(
      `Branche ${payload.branch} introuvable → ignore`,
    );
    return;
  }

  // 2. Vérifier si la station existe dans la branche
  const station = await Station.findOne({
    where: {
      code: payload.station,
      branchId: branch.id,
    },
  });

  // ❌ Station inexistante → on ignore totalement
  if (!station) {
    console.warn(
      `Station ${payload.station} inexistante dans la branche ${branch.displayName} → ignore`,
    );
    return;
  }

  // 3. Vérifier si la station est active
  if (!station.isActive) {
      const pd={ station: station.code, branch: branch.code }
      const entity=await this.flashGatewayServiceFactory.readRecord(client.data.user as any, pd as any)
      if (!entity) return
      let payload={...entity,sentWeight:this.DEFAULT_WEIGHT,status: StatusFlashEnum.DESABLE_STATION,statusMsg: this.getStatusMsg(StatusFlashEnum.DESABLE_STATION),isMonitored:false}
      return await this.flashGatewayServiceFactory.updateRecord(client.data.user as any, {id: (await entity).id}, payload as any);
    }
    payload.statusMsg = this.getStatusMsg(payload.status);

   return await this.flashGatewayServiceFactory.createRecord(client.data.user as any, payload as any);
}



private async createStop(
  manager,
  st,
  br:any,
  reasoncode: string,
  reason: string,
) {

  const stpActivity = manager.create(StationActivity, {
    stationId: st.id,
    branchId: br.id,
    startAt: new Date(),
    isActive: true,
    type: ActivityType.STOP,
    reasoncode,
    reason
    });

  try {
    await manager.save(stpActivity);
  } catch (err) {
    if (err.code === '23505') return;
    throw err;
  }
}

async startActivity(stationCode: string, branchCode: string,reasoncode:string,reason: string='') {
      const st = await Station.findOne({
        where: { code: stationCode },
      });
      const br = await Branch.findOne({
        where: { code: branchCode },
      });
      if (!st || !br) return;
      await this.transactionService.runInTransaction(async (manager) => {
      const last = await manager.findOne(StationActivity, {
        where: {
          stationId: st.id,
          branchId: br.id,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
        lock: { mode: 'pessimistic_write' }, // 🔥 VERY IMPORTANT
      });

      // 🔴 Cas incohérent
      if (last && last.type === ActivityType.STOP && last.isActive) {
        last.isActive = false;
        last.endAt = new Date();
        await manager.save(last);
      }

      // ❌ Déjà actif
      if (last && last.type === ActivityType.START && last.isActive) {
        return;
      }

        // ✅ Création
        const newActivity = manager.create(StationActivity, {
          stationId: st.id,
          branchId: br.id,
          startAt: new Date(),
          isActive: true,
          type: ActivityType.START,
          reasoncode,
          reason,
        });

        await manager.save(newActivity);
        });

  }

async stopActivity(
  stationCode: string,
  branchCode: string,
  reasonCode:eventReasonCodeActivityFlashEnum ,
  reason: string = '',
) {
  const st = await Station.findOne({ where: { code: stationCode } });
  const br = await Branch.findOne({ where: { code: branchCode } });

  if (!st || !br) return;

  await this.transactionService.runInTransaction(async (manager) => {
    const last = await manager.findOne(StationActivity, {
      where: {
        stationId: st.id,
        branchId: br.id,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
      lock: { mode: 'pessimistic_write' },
    });
    


    // ❌ Rien d’actif
    if (!last) {
      return await this.createStop(manager, st, br, reasonCode, reason);
    }
  
   

    // 🔴 START actif → on ferme
    if (last.type === ActivityType.START && last.isActive==true) {
      last.isActive = false;
      last.endAt = new Date();
      await manager.save(last);
      return await this.createStop(manager, st, br, reasonCode, reason);
    }

    // 🧠 CAS STOP actif
    if (last.type === ActivityType.STOP && last.isActive) {

      // ✅ même reasonCode → rien
      if (last.reasoncode === reasonCode) {
        return;
      }

      // 🔥  → AUTO_SHUTDOWN
      if (
        last.reasoncode === eventReasonCodeActivityFlashEnum.STALE &&
        reasonCode === eventReasonCodeActivityFlashEnum.SERVICE_AUTO_SHUTDOWN_AFTER_STALE
      ) {
        // fermer le STOP STALE
        last.isActive = false;
        last.endAt = new Date();
        await manager.save(last);

        // créer STOP AUTO_SHUTDOWN
        return await this.createStop(manager, st, br, reasonCode, reason);
      }

      // ⚠️ autres cas : on bloque
      return;
    }
  });
}


@OnEvent('stale_flash.updated')
  async handleFlashUpdate(payload: any) {
   this.server.emit(SocketServertoClientBKOfficeEventEnum.SENT_NEW_FLASH, {
    response: 'sent_new_flash',
    data: payload,
  });
  await this.stopActivity(payload.station, payload.branch,payload.reasoncode,payload.reason);

}

  // ---------- events utilitaires ----------
  @SubscribeMessage(SocketClientRWBEventEnum.CLOSE_SESSION)
  handleCloseSession(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // si on veut forcer la déconnexion d'un client qui le demande:
    try {
      client.emit(SocketClientRWBEventEnum.CLOSE_SESSION, { response: 'Session fermée par requête client', data });
      // Si tu veux déconnecter proprement:
      client.disconnect(true);
      //console.log(`Client ${client.id} déconnecté à la demande.`);
      return { status: 'ok' };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }


  @SubscribeMessage(SocketClientRWBEventEnum.NEW_ITEM)
  handleCreate(@MessageBody() data: any) {
    this.server.emit(SocketServertoClientBKOfficeEventEnum.CREATE_ACTION, { response: 'create_action', data });
  }

  
}

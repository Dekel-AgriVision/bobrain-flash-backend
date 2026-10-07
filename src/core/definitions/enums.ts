/* eslint-disable prettier/prettier */
export enum RoleEnum {
  MANAGER = 'manager',
  ADMIN = 'admin',
  GUEST = 'guest',
}

export enum YesNoActionEnum {
  yes = 'yes',
  no = 'no',
}

export enum AbilitySubjectEnum {
  all = 'all',
  User = 'User',
  Branch = 'Branch',
  Station = 'Station',
  StationActivity = 'StationActivity',
  Role = 'Role',
  SentWeight = 'SentWeight',
  Flash = 'Flash',
  Setting = 'Setting',
  AuthUser = 'AuthUser',
}

export enum AbilityActionEnum {
  admin = 'admin',
  manage = 'manage',
  read = 'read',
  create = 'create',
  edit = 'edit',
  delete = 'delete',
  stream = 'stream',
}
export enum userTypeEnum {
  OPERATEUR = 'OPERATOR',
  OTHER = 'OTHER',
}

export enum AccessTypeEnum {
  // Owner
  owner = 'owner',
  admin = 'admin',
  // Manager
  manager = 'manager',

  guest = 'guest',
}

export enum ActivityType {
  START = 'START',
  STOP = 'STOP',
  PAUSE = 'PAUSE', // optionnel si besoin plus tard
}

export enum StatusFlashEnum {
  SERIAL_CONNECTED = 'SERIAL_CONNECTED',
  SERIAL_DISCONNECTED = 'SERIAL_DISCONNECTED',
  DISPLAY_ON = 'DISPLAY_ON',
  DISPLAY_OFF = 'DISPLAY_OFF',
  SERVICE_SHUTDOWN = 'SERVICE_SHUTDOWN',
  WEIGHT_OK = 'WEIGHT_OK',
  WEIGHT_NOT_OK = 'WEIGHT_NOT_OK',
  DISCONNECTED = 'DISCONNECTED',
  STALE = 'STALE',
  DESABLE_STATION = 'DESABLE_STATION',
  BRIDGE_EMPTY = 'BRIDGE_EMPTY',
}

// Correspondance exhaustive avec StatusFlashEnum : Record<StatusFlashEnum, ...> oblige
// à fournir une entrée par valeur de l'enum, sinon erreur de compilation.
export const STATUS_MAP: Record<StatusFlashEnum, { label: string; color: string; icon?: string }> = {
  [StatusFlashEnum.SERIAL_CONNECTED]: {
    label: 'Port Série connectée',
    color: 'success',
    icon: 'mdi:lan-connect',
  },
  [StatusFlashEnum.SERIAL_DISCONNECTED]: {
    label: 'Port Série déconnectée',
    color: 'error',
    icon: 'mdi:lan-disconnect',
  },
  [StatusFlashEnum.DISPLAY_ON]: {
    label: 'Affichage ON',
    color: 'info',
    icon: 'mdi:monitor',
  },
  [StatusFlashEnum.DISPLAY_OFF]: {
    label: 'Afficheur éteint',
    color: 'error',
    icon: 'mdi:monitor-off',
  },
  [StatusFlashEnum.SERVICE_SHUTDOWN]: {
    label: 'Service arrêté',
    color: 'error',
    icon: 'mdi:power',
  },
  [StatusFlashEnum.WEIGHT_OK]: {
    label: 'Poids valide',
    color: 'success',
    icon: 'mdi:scale',
  },
  [StatusFlashEnum.WEIGHT_NOT_OK]: {
    label: 'Poids non valide',
    color: 'warning',
    icon: 'mdi:scale',
  },
  [StatusFlashEnum.DISCONNECTED]: {
    label: 'Déconnecté',
    color: 'error',
    icon: 'mdi:lan-disconnect',
  },
  [StatusFlashEnum.STALE]: {
    label: 'Connexion perdue (problème reseau)',
    color: 'warning',
    icon: 'mdi:wifi-alert',
  },
  [StatusFlashEnum.DESABLE_STATION]: {
    label: 'Station désactivée',
    color: 'error',
    icon: 'mdi:power-off',
  },
  [StatusFlashEnum.BRIDGE_EMPTY]: {
    label: 'Pont bascule vide',
    color: 'info',
    icon: 'mdi:monitor',
  },
};


export enum eventReasonActivityFlashEnum {
  STALE = 'Latence reseau',
  DISPLAY_ON = 'Station active',
  SERVICE_SHUTDOWN = 'Arrêt du service',
  SERVICE_AUTO_SHUTDOWN_AFTER_STALE = 'Arrêt du service apres latence longue',
  DESABLE_STATION = 'Station désactivée',
  SERIAL_DISCONNECTED = 'Perte de connexion série',
}

export enum eventReasonCodeActivityFlashEnum {
  STALE = '1004',
  DISPLAY_ON = '1000',
  SERVICE_SHUTDOWN = '1001',
  SERVICE_AUTO_SHUTDOWN_AFTER_STALE = '1005',
  DESABLE_STATION = '1002',
  SERIAL_DISCONNECTED = '1003',
}

export enum SocketClientRWBEventEnum {
  SEND_WEIGHT = 'sendWeight',
  CLOSE_SESSION = 'closesession',
  NEW_ITEM = 'new_Item',
}

export enum SocketServertoClientBKOfficeEventEnum {
  SENT_WEIGHT_DATA = 'sentWeightData',
  SENT_NEW_FLASH = 'sent_new_flash',
  START_FLASH_BACKEND = 'start_flash_backend',
  CREATE_ACTION = 'create_action',
}

export enum SocketServerToERPClientEventEnum {
  NEW_ITEM_TO_ERP = 'new_Item_to_erp',
}

export enum StationEnumm {
  AY1 = 'AY1',
  AY2 = 'AY2',
  AD1 = 'AD1',
  AD2 = 'AD2',
  EB1 = 'EB1',
  EB2 = 'EB2',
}

export enum AuthLogAuthMethodEnum {
  local = 'local',
  jwt = 'jwt',
}

/**
 * Consultation *******************************
 */

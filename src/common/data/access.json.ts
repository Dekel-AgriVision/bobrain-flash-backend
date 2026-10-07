import { AbilitySubjectEnum } from '../../core/definitions/enums';
import { EntityType, PermissionsType } from '../../core/definitions/types';
import { CreateAccessDto } from '../../core/dto/user/create-access.dto';

// Default Front accesss
export const getDefaultAccesss = () => {
  return <CreateAccessDto[]>[
    // Administrateur
    {
      name: 'default',
      entity: <EntityType>{
        [AbilitySubjectEnum.User]: false,
        [AbilitySubjectEnum.Branch]: false,
        [AbilitySubjectEnum.Flash]: false,
        [AbilitySubjectEnum.Role]: false,
        [AbilitySubjectEnum.Setting]: false,
        [AbilitySubjectEnum.SentWeight]: false,
        [AbilitySubjectEnum.Station]: false,
        [AbilitySubjectEnum.StationActivity]: false,
        [AbilitySubjectEnum.AuthUser]: false,
      },
      permissions: <PermissionsType>{
        create: false,
        read: false,
        edit: false,
        delete: false,
        stream: false,
      },
    },
  ];
};

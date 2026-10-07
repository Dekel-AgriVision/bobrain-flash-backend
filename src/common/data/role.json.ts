import { RolePermissionsType } from '../../core/definitions/types';
import { CreateRoleDto } from '../../core/dto/user/create-role.dto';

// Default Front roles
export const getDefaultRoles = () => {
  return <CreateRoleDto[]>[
    
    // Gestionnaire 
    {
      name: 'manager',
      displayName: 'Gestionnaire ',
      isActive: true,
      description: 'Gestionnaire ',
      // Accès complet explicite (sans règle manage/all)
      adminPermission: true,
      permissions: <RolePermissionsType>{},
    },

  ];
};

/**
 * Role *********************************
 */
export type RolePermissionsType = {
  [entityName: string]:
    | boolean
    | {
        create?: boolean;
        read?: boolean;
        edit?: boolean;
        delete?: boolean;
        stream?: boolean;
      };
};

export type EntityType = {
  [entityName: string]: boolean;
};

export type PermissionsType = {
  [permissionName: string]: boolean;
};

export type RoleFieldPermissionsType = {
  [entityName: string]: {
    read?: string[];
    edit?: string[];
  };
};

export type VariantOptionsType = {
  name: string;
  values: string[];
};

/**
 * Access *********************************
 */
export type AccessPermissionsType = {
  [entityName: string]:
    | boolean
    | {
        create?: boolean;
        read?: boolean;
        edit?: boolean;
        delete?: boolean;
        stream?: boolean;
      };
};

export type AccessFieldPermissionsType = {
  [entityName: string]: {
    read?: string[];
    edit?: string[];
  };
};

import { YesNoActionEnum } from '../definitions/enums';
import { Branch } from '../entities/subsidiary/branch.entity';
import { User } from '../entities/user/user.entity';

export const getAccessTableForm = () => {
  const yesNoActions: string[] = Object.values(YesNoActionEnum);
  const permissionActions: string[] = ['yes', 'no'];
  return {
    User: {
      create: yesNoActions,
      read: permissionActions,
      edit: permissionActions,
      delete: permissionActions,
      stream: permissionActions,
    },
    Branch: {
      create: yesNoActions,
      read: permissionActions,
      edit: permissionActions,
      delete: permissionActions,
      stream: permissionActions,
    },
    Product: {
      create: yesNoActions,
      read: permissionActions,
      edit: permissionActions,
      delete: permissionActions,
      stream: permissionActions,
    },
    AuthUser: {
      read: permissionActions,
      stream: permissionActions,
    },
  };
};
export const getAccessFieldTableForm = () => {
  return {
    User: User.getRepository().metadata.columns.map((e) => e.propertyName),
    Branch: Branch.getRepository().metadata.columns.map((e) => e.propertyName),
  };
};

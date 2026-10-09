/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Role } from '../../entities/user/role.entity';
import {
  getDefaultBranches,
  getDefaultAccesss,
  getDefaultRoles,
  getDefaultUsers,
  getDefaultErpconnections,
} from 'src/common';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { User } from '../../entities/user/user.entity';
import { isEmpty } from 'lodash';
import { Access } from 'src/core/entities/user/access.entity';
import { RoleEnum } from 'src/core/definitions/enums';
import { Setting } from 'src/core/entities/setting/setting.entity';
import { getDefaultSettings } from 'src/common/data/setting.json';
import { Station } from 'src/core/entities/setting/station.entity';
import { getDefaultStations } from 'src/common/data/station.json';
import { ErpConnection } from 'src/core/entities/setting/erp-connection.entity';

@Injectable()
export class DefaultDataService {
  async createDefaultData() {
    const branches = await this.createBranchesDefaultData();
    const acccess = await this.createAccessDefaultData();
    const roles = await this.createRolesDefaultData();
    await this.ensureDefaultRoleAccess();
    const users = await this.createUsersDefaultData();
    const stations = await this.createStationsDefaultData();
    const settings = await this.createSettingsDefaultData();
    const erpConnections=await this.createErpConnectionsDefaultData();
    
    return {
      branches: branches.length,
      acccess: acccess.length,
      roles: roles.length,
      users: users.length,
      stations: stations.length,
      settings:settings.length,
      erpConnections:erpConnections.length
    };
  }

  async createBranchesDefaultData(): Promise<Branch[]> {
    const defaultBranches = getDefaultBranches();
    const branches: Branch[] = [];
    let exists: number;
    for (const dto of defaultBranches) {
      exists = await Branch.countBy({ code: dto.code });
      if (exists <= 0) {
        branches.push(await Branch.save(dto as Branch));
      }
    }
    return branches;
  }

  async createSettingsDefaultData(): Promise<Setting[]> {
    const defaultSettings = getDefaultSettings();
    const settings: Setting[] = [];
    let exists: number;
    for (const dto of defaultSettings) {
      exists = await Setting.countBy({
        name: dto.name,
      });
      if (exists <= 0) {
        settings.push(await Setting.save(dto as Setting));
      }
    }
    return settings;
  }

  private async createAccessDefaultData(): Promise<Access[]> {
    const defaultAccess = getDefaultAccesss();
    const access: Access[] = [];
    let exists: number;
    for (const dto of defaultAccess) {
      exists = await Access.countBy({ name: dto.name });
      if (exists <= 0) {
        access.push(await Access.save(dto as Access));
      }
    }
    return access;
  }

  private async createRolesDefaultData(): Promise<Role[]> {
    const defaultRoles = getDefaultRoles();
    const roles: Role[] = [];
    let exists: number;

    for (const dto of defaultRoles) {
     
      exists = await Role.countBy({ name: dto.name });

      if (exists <= 0) {
        roles.push(await Role.save(dto as any));
      }
    }
    return roles;
  }

  /**
   * Le rôle gestionnaire par défaut héritait auparavant d'une règle `manage all`.
   * S'il n'a aucune permission configurée, on lui donne l'accès complet explicite
   * pour ne pas bloquer le compte administrateur.
   */
  private async ensureDefaultRoleAccess() {
    // Plusieurs rôles peuvent avoir le type `manager` (ADR-0021) : seul le rôle
    // par défaut (le plus ancien) est concerné, jamais un rôle créé ensuite.
    const role = await Role.findOne({
      where: { name: RoleEnum.MANAGER },
      order: { createdAt: 'ASC' },
    });
    if (role && role.adminPermission !== true && isEmpty(role.permissions)) {
      role.adminPermission = true;
      await role.save();
    }
  }

   private async createStationsDefaultData(): Promise<Station[]> {
    const defaultStations = getDefaultStations();
    const stations: Station[] = [];
    let exists: number;

    for (const dto of defaultStations) {
     
      exists = await Station.countBy({ code: dto.code });

      if (exists <= 0) {
        const branch=await Branch.findOneBy({ code: process.env.DEFAULT_BRANCH_CODE });
        if (branch) {
          dto.branchId= branch.id;
        }
        stations.push(await Station.save(dto as any));
      }
    }
    return stations;
  }

    private async createErpConnectionsDefaultData(): Promise<ErpConnection[]> {
    const defaultErpconnections = getDefaultErpconnections();
    const erpconnections: ErpConnection[] = [];
    let exists: number;

    for (const dto of defaultErpconnections) {
     
      exists = await ErpConnection.countBy({ code: dto.code });

      if (exists <= 0) {
        const branch=await Branch.findOneBy({ code: process.env.DEFAULT_BRANCH_CODE });
        if (branch) {
          dto.branchId= branch.id;
        }
        erpconnections.push(await ErpConnection.save(dto as any));
      }
    }
    return erpconnections;
  }

  /*private async createUsersDefaultData(): Promise<User[]> {
    const defaultUsers = getDefaultUsers();
    let exists: number;
    const branches = await Branch.findBy({});
    const roles = await Role.findBy({ name: AccessTypeEnum.owner });

    const users: User[] = await User.findBy({});
    if (users.length > 0 || branches.length <= 0 || roles.length <= 0) {
      return [];
    }

    let user: User;
    for (const dto of defaultUsers) {
      exists = await User.countBy({ username: dto.username });
      if (exists <= 0) {
        user = User.create(dto);

        if (!isEmpty(dto.newPassword)) {
          await user.setNewPassword(dto.newPassword);
        }
        if(dto.username== AccessTypeEnum.admin){
          user.roleId=roles[0].id;
        }else{
        const roles = await Role.findBy({ name: AccessTypeEnum.admin });
         user.roleId=roles[0].id;
        }
        users.push(
          await User.save({
            ...user,
            branchId: branches[0].id,
            //roleId: roles[0].id,
          }),
        );
      }
    }
    return users;
  }*/

 private async createUsersDefaultData(): Promise<User[]> {
  const defaultUsers =  getDefaultUsers();
  const defaultBranches =  getDefaultBranches();
  //const defaultRoles =  getDefaultRoles();  

  const users: User[] = await User.find();
  if (users.length > 0 || defaultBranches.length <= 0 ) {
    return [];
  }

  // 🔥 récupérer les rôles une seule fois
  const managerRole = await Role.findOne({
    where: { name: RoleEnum.MANAGER },
    order: { createdAt: 'ASC' },
  });
  const defaultBranch =
    (await Branch.findOneBy({ code: defaultBranches[0].code })) ??
    (await Branch.findOneBy({ displayName: defaultBranches[0].displayName }));

  if (!defaultBranch) {
    throw new Error(
      `Branche par défaut introuvable (code: ${defaultBranches[0].code})`,
    );
  }


  if (!managerRole) {
    throw new Error(`Rôle introuvable: ${RoleEnum.MANAGER}`);
  }

  const createdUsers: User[] = [];

  for (const dto of defaultUsers) {
    const exists = await User.countBy({ username: dto.username });

    if (exists <= 0) {
      const user = User.create(dto);

      if (!isEmpty(dto.newPassword)) {
        await user.setNewPassword(dto.newPassword);
      }

      // ✅ logique claire
      //if (dto.roleName === RoleEnum.MANAGER) {
        user.roleId = managerRole?.id;
      /*} else {
        user.roleId = adminRole?.id;
      }*/

      createdUsers.push(
        await User.save({
          ...user,
          branchId: defaultBranch.id,
        }),
      );
    }
  }

  return createdUsers;
}
  }

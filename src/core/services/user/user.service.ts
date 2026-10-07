import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { AuthUserData } from '../../classes/auth-user.data';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { User } from '../../entities/user/user.entity';
import { CreateUserDto } from '../../dto/user/create-user.dto';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { REQUEST } from '@nestjs/core';
import { UpdateUserDto } from '../../dto/user/update-user.dto';
import { isEmpty } from 'lodash';
import {
  existsConstraint,
  isUniqueConstraint,
  PaginatedService,
} from '@app/typeorm';
import { Role } from '../../entities/user/role.entity';
import { AbstractService } from '../abstract.service';
//import { MailerSenderService } from 'src/mailer/services/mailer.service';
import { Branch } from 'src/core/entities/subsidiary/branch.entity';

@Injectable()
export class UserService extends AbstractService<User> {
  public NOT_FOUND_MESSAGE = `Utilisateur non trouvé`;

  constructor(
    @InjectRepository(User) private _repository: Repository<User>,
    protected paginatedService: PaginatedService<User>,
    //protected mailerService: MailerSenderService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<User> {
    return this._repository;
  }

  async authenticate(username: string, password: string): Promise<AuthUser> {
    const user = await this._repository.findOne({
      relations: { role: true, branch: true },
      where: { username: username },
    });

    const errMessage = `Nom d'utilisateur ou mot de passe incorrect`;

    if (!user) {
      throw new UnauthorizedException([{ username: [errMessage] }], errMessage);
    }

    if (!(await user.checkPassword(password))) {
      throw new UnauthorizedException([{ username: [errMessage] }], errMessage);
    }

    return this.toAuthUser(user);
  }

  async createRecord(dto: CreateUserDto): Promise<User> {
    // Check exists roleId
    if (dto.roleId) {
      await existsConstraint(
        'roleId',
        Role,
        { id: dto.roleId },
        { message: `Le rôle sélectionné n'existe pas` },
      );
    }

    if (dto.branchId) {
      await existsConstraint(
        'branchId',
        Branch,
        { id: dto.branchId },
        { message: `La surccusale sélectionné n'existe pas` },
      );
    }

    // Check unique username
    if (dto.username) {
      await isUniqueConstraint(
        'username',
        User,
        { username: dto.username },
        {
          message: `Le nom d'utilisateur "${dto.username}" de l'utilisateur est déjà utilisé`,
        },
      );
    }
    // Check exists email
    if (dto.email) {
      await isUniqueConstraint(
        'email',
        User,
        { email: dto.email },
        { message: `L'email est déjà utilisé` },
      );
    }

    // Invite user to acces backoffice

    //if (this.validateEmail(dto.email)) {
    //await this.mailerService.sendEmail(email, subject,template,ctx);
    //const newpassword = await this.sendNewPasswordToEmail(dto);
    //dto.newPassword = newpassword;
    //}

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    const user = this._repository.create(dto);

    user.isActive = true;
    user.roleId = dto.roleId;

    user.createdById = authUser?.id;
    user.updatedById = authUser?.id;

    if (!isEmpty(dto.newPassword)) {
      await user.setNewPassword(dto.newPassword);
    }

    return await super.createRecord({
      ...user,
      isActive: true,
      roleId: dto.roleId,
    });
  }

  async updateRecord(optionsWhere: FindOptionsWhere<User>, dto: UpdateUserDto) {
    // Check exists roleId
    if (dto.roleId) {
      await existsConstraint(
        'roleId',
        Role,
        { id: dto.roleId },
        { message: `Le rôle sélectionné n'existe pas` },
      );
    }

    await existsConstraint(
      'branchId',
      Branch,
      { id: dto.branchId },
      { message: `La succursale sélectionnée n'existe pas` },
    );

    if (dto.username) {
      // Check unique username
      await isUniqueConstraint(
        'username',
        User,
        {
          username: dto.username,
          id: Not(optionsWhere.id),
        },
        {
          message: `Le nom d'utilisateur "${dto.username}" de l'utilisateur est déjà utilisé`,
        },
      );
    }

    let user = await this._repository.findOneBy(optionsWhere);

    if (!user) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    //invite user to backoffice

    user = await super.updateRecord(optionsWhere, {
      ...dto,
      roleId: dto.roleId ?? user.roleId,
    });

    if (!isEmpty(dto.newPassword)) {
      await user.setNewPassword(dto.newPassword);
      user = await this.repository.save(user);
    }
    return user;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<User>) {
    const user = await this.repository.findOneBy({ id: optionsWhere?.id });
    if (!user) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return await super.deleteRecord(optionsWhere);
  }

  async setNewPassword(user: User, oldPassword: string, newPassword: string) {
    // Check user current password
    if (!(await user.checkPassword(oldPassword))) {
      throw new BadRequestException(
        [
          {
            password: [`Mot de passe actuel incorrect`],
          },
        ],
        `Mot de passe actuel invalide`,
      );
    }

    // Set user password
    await user.setNewPassword(newPassword);
    return await this._repository.save(user);
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<User>> {
    const authUser = await super.checkSessionBranch();
    if (!authUser.hasAllBranchesAccess()) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(String(email).toLowerCase());
  }

  toAuthUser(user: User): AuthUser {
    const authUser = new AuthUser();
    authUser.username = user.username;
    authUser.userId = user.id;
    authUser.user = user;
    // Compte sans succursale : pas de plantage (TypeError) au login
    authUser.branchId = user.branch?.id ?? user.branchId ?? null;
    authUser.branch = user.branch ?? null;
    authUser.targetBranchId = authUser.branchId;
    authUser.targetBranch = user.branch ?? null;
    authUser.roleId = user.roleId;
    authUser.role = user.role;
    authUser.applicationId = 'bobrain-app';
    authUser.userData = {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      branchId: user.branchId,
      roleId: user.role?.id,
    } as AuthUserData;

    return authUser;
  }

  protected async sendNewPasswordToEmail(dto: any): Promise<string> {
    //const { email, username } = dto;
    /*const subject = 'Paramètres de connexion';
    const template = 'welcome';*/
    const newpassword = this.generateRandomPassword(8);
    /*const ctx = {
      username: username,
      password: newpassword,
    };*/
    //await this.mailerService.sendEmail(email, subject, template, ctx);
    return newpassword;
  }
}

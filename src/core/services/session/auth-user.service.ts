import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { Repository } from 'typeorm';
import { BranchService } from '../subsidiary/branch.service';

@Injectable()
export class AuthUserService {
  constructor(
    @InjectRepository(AuthUser) private repository: Repository<AuthUser>,
    private branchService: BranchService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async getSession(id?: string): Promise<AuthUser> {
    const requestAuthUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    const authUser = await this.repository.findOne({
      relations: {
        user: true,
        role: true,
        targetBranch: true,
        branch: true,
      },
      where: { id: id ?? requestAuthUser?.id ?? '' },
    });

    return authUser;
  }

  async switchTargetBranch(branchId: string) {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    if (!authUser) {
      throw new UnauthorizedException(`Impossible de récupération la session`);
    }
    const branch = await this.branchService.readOneRecord({
      where: { id: branchId ?? '' },
    });

    authUser.targetBranchId = branch.id;
    authUser.targetBranch = branch;
    authUser.updatedById = authUser.id;

    await this.repository.save(authUser);

    return authUser;
  }
}

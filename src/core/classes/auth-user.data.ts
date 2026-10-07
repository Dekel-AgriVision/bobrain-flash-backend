import { PartialType, PickType } from '@nestjs/swagger';
import { User } from '../entities/user/user.entity';

export class AuthUserData extends PartialType(
  PickType(User, [
    'id',
    'username',
    'lastName',
    'firstName',
    'email',
    'phoneNumber',
    'address',
    'branchId',
    'roleId',
  ] as const),
) {}

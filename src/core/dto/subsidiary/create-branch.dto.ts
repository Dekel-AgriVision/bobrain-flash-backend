import { PickType } from '@nestjs/swagger';
import { Branch } from '../../entities/subsidiary/branch.entity';

export class CreateBranchDto extends PickType(Branch, [
  'code',
  'displayName',
  'email',
  'phoneNumber',
  'description',
  'address',
  'city',
  'isActive',
  'isParentCompany',
] as const) {}

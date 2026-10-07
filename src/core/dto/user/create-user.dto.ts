import { User } from '../../entities/user/user.entity';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { BranchToUser } from 'src/core/entities/subsidiary/branch-to-user.entity';
import { userTypeEnum } from 'src/core/definitions/enums';

export class CreateUserDto extends PickType(User, [
  'username',
  'email',
  'phoneNumber',
  'branchId',
  'roleId',
] as const) {
  @ApiPropertyOptional({ minLength: 3, description: `Nom` })
  @IsOptional()
  @IsString()
  firstName: string;
  @ApiPropertyOptional({ minLength: 3, description: `Prenom` })
  @IsOptional()
  @IsString()
  lastName: string;
  @ApiPropertyOptional({ minLength: 3, description: `Email` })
  @IsOptional()
  @IsString()
  email: string;
  @ApiPropertyOptional({  description: `type` })
  @IsOptional()
  @IsString()
  type: userTypeEnum;

  @ApiPropertyOptional({ description: `est actives` })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  // Obligatoire à la création : un compte sans mot de passe ne peut jamais se connecter
  @ApiProperty({ minLength: 5, description: `Mot de passe` })
  @IsNotEmpty({ message: `Le mot de passe est obligatoire` })
  @IsString()
  @MinLength(5, { message: `Le mot de passe doit contenir au moins 5 caractères` })
  newPassword: string;
}

export class CreateUserToBranchDto extends PickType(BranchToUser, [
  'branchId',
] as const) {}

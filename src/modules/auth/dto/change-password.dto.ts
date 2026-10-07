import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: `Mot de passe actuel` })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: `Nouveau mot de passe` })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: `Confirmation nouveau mot de passe` })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

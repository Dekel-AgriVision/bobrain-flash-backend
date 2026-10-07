import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty({ description: `Nom d'utilisateur` })
  @IsNotEmpty()
  @IsString()
  username: string;
}

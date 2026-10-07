import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: "Nom d'utilisateur" })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

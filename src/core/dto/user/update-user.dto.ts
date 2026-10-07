import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Tous les champs sont optionnels en modification (y compris newPassword :
// le mot de passe n'est changé que s'il est fourni).
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, [] as const),
) {}

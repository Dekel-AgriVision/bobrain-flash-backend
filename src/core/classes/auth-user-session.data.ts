import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

/**
 * Authenticated user data
 */
export class AuthUserSessionData {
  @ApiProperty({ description: `Données de la session` })
  session: AuthUser;
  @ApiProperty({
    description: `Matrice des permissions. Cette donnée est exploitable par la bibliothèque [casl.js](https://casl.js.org)`,
  })
  abilities: any;
}

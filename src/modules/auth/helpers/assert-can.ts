import { UnauthorizedException } from '@nestjs/common';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import {
  AbilityActionEnum,
  AbilitySubjectEnum,
} from 'src/core/definitions/enums';

/**
 * Vérifie qu'une session a le droit `action` sur `subject` (ADR-0018).
 * - Pas de session => 401 (on n'utilise plus `authUser?.throwUnlessCan`, qui
 *   laissait passer la requête si la session était absente).
 * - Droit manquant => 403 « Accès réfusé ».
 */
export async function assertCan(
  authUser: AuthUser | undefined,
  action: AbilityActionEnum,
  subject: AbilitySubjectEnum | any,
): Promise<void> {
  if (!authUser) {
    throw new UnauthorizedException(`Session introuvable`);
  }
  await authUser.throwUnlessCan(action, subject);
}

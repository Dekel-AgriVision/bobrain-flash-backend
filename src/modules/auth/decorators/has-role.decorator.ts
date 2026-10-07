import { SetMetadata } from '@nestjs/common';
import { ROLE_META_KEY } from '../definitions/constants';

/**
 * Inject user role policy metadata.
 * Used by ../guards/has-role.guard.ts
 */
export const HasRole = (...roles: string[]) =>
  SetMetadata(ROLE_META_KEY, roles);

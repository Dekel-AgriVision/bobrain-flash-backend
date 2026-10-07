import { SetMetadata } from '@nestjs/common';
import { ABILITIES_META_KEY } from '../definitions/constants';

/**
 * Inject user ability request metadata.
 * Used by ../guards/can.guard.ts
 */
export const Can = (abilities: string | string[], strict?: boolean) =>
  SetMetadata(ABILITIES_META_KEY, { abilities, strict });

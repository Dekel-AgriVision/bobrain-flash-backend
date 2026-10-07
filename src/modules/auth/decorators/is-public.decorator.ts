import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_META_KEY } from '../definitions/constants';

/**
 * Inject request resource is public access metadata.
 * Means JWT guard is not verify
 * Used by ../guards/jwt-auth.guard.ts
 */
export const IsPublic = () => SetMetadata(IS_PUBLIC_META_KEY, true);

import { SetMetadata } from '@nestjs/common';
import { IS_ANONYMOUS_META_KEY } from '../definitions/constants';

/**
 * Inject request resource is anonymous access metadata.
 * Means Application ID and Client ID is not verify
 * Used by ../guards/request-issuer.guard.ts
 */
export const IsAnonymous = () => SetMetadata(IS_ANONYMOUS_META_KEY, true);

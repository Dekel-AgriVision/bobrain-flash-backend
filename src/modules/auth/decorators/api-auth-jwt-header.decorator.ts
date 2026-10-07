import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { AUTH_USER_JWT_HEADER } from '../definitions/constants';

/**
 * Inject JWT OpenApi header documentation
 */
export const ApiAuthJwtHeader = () => {
  return applyDecorators(
    ApiHeader({
      name: AUTH_USER_JWT_HEADER,
      required: true,
      description: 'Authenticated user JWT.',
    }),
  );
};

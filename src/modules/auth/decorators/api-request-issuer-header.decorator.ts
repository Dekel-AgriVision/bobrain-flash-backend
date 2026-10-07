import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { REQUEST_APP_ID_HEADER } from '../definitions/constants';

/**
 * Inject Application ID OpenApi header documentation
 */
export const ApiRequestIssuerHeader = () => {
  return applyDecorators(
    ApiHeader({
      name: REQUEST_APP_ID_HEADER,
      required: false,
      description: 'Application ID. Usually application code.',
    }),
  );
};

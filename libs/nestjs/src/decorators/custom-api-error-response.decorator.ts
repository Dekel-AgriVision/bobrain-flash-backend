import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import { HttpResponseError } from '../exceptions';

export const CustomApiErrorResponse = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request',
      type: HttpResponseError,
    }),
  );
};

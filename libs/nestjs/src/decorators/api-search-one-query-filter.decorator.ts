import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiSearchOneParamOptions } from './api-search-params.type';

export const ApiSearchOneQueryFilter = () => {
  return applyDecorators(
    ApiQuery({
      name: 'searchOneQueryFilterOptions',
      type: ApiSearchOneParamOptions,
      required: false,
    }),
  );
};

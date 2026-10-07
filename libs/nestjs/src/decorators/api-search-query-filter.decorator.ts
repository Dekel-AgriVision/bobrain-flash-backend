import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ApiSearchParamOptions } from './api-search-params.type';

export const ApiSearchQueryFilter = () => {
  return applyDecorators(
    ApiQuery({
      name: 'searchQueryFilterOptions',
      type: ApiSearchParamOptions,
      required: false,
    }),
  );
};

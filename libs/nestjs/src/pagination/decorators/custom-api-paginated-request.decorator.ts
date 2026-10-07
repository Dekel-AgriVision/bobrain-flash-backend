import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const CustomApiPaginatedRequest = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      type: 'integer',
      example: 1,
      required: false,
      description: 'The current page number.',
    }),
    ApiQuery({
      name: 'per_page',
      type: 'integer',
      example: 25,
      required: false,
      description: 'The number of items to be shown per page.',
    }),
  );
};

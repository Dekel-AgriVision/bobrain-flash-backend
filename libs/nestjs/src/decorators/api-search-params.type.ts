import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ApiSearchParamWhereTypeEnum {
  equals = 'equals',
  notEquals = 'notEquals',
  greaterThan = 'greaterThan',
  lessThan = 'lessThan',
  greaterThanOrEquals = 'greaterThanOrEquals',
  lessThanOrEquals = 'lessThanOrEquals',
  isNull = 'isNull',
  isNotNull = 'isNotNull',
  isTrue = 'isTrue',
  isFalse = 'isFalse',
  in = 'in',
  notIn = 'notIn',
  contains = 'contains',
  notContains = 'notContains',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
  like = 'like',
  notLike = 'notLike',
  or = 'or',
  today = 'today',
  past = 'past',
  future = 'future',
  lastSevenDays = 'lastSevenDays',
  currentMonth = 'currentMonth',
  lastMonth = 'lastMonth',
  nextMonth = 'nextMonth',
  currentYear = 'currentYear',
  lastYear = 'lastYear',
  lastXDays = 'lastXDays',
  nextXDays = 'nextXDays',
  olderThanXDays = 'olderThanXDays',
  afterXDays = 'afterXDays',
  between = 'between',
  bool = 'bool',
}

export class ApiSearchParamWhereOptions {
  @ApiPropertyOptional({
    enum: ApiSearchParamWhereTypeEnum,
    enumName: 'ApiSearchParamWhereTypeEnum',
    default: ApiSearchParamWhereTypeEnum.equals,
  })
  type?: ApiSearchParamWhereTypeEnum;

  @ApiPropertyOptional()
  attribute?: string;

  @ApiPropertyOptional()
  value?: any;
}

export class ApiSearchParamOptions {
  @ApiPropertyOptional({
    example: 1,
    description: 'Current page for pagination.',
  })
  page?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'How much records to return.',
  })
  per_page?: number;

  @ApiPropertyOptional({
    type: 'string',
    isArray: true,
    description:
      'String (or Array of strings if search params passed in JSON).<br/>' +
      'What record attributes to return. Separated by comma. Whitespaces are not allowed. ' +
      'Specify only attributes that you need, it can improve performance.',
  })
  select?: string | string[];

  @ApiPropertyOptional({
    type: 'string',
    isArray: true,
    description:
      'String (or Array of strings if search params passed in JSON).<br/>' +
      'What relations to return. Separated by comma. Whitespaces are not allowed. ' +
      'Specify only relations that you need, it can improve performance.',
  })
  relations?: string | string[];

  @ApiPropertyOptional({
    type: () => [ApiSearchParamWhereOptions],
    example: '[{"value": "global text fields search"}]',
    description:
      'Where parameter is an array if items, that can contain nested items. The data should be URL-encoded. API clients provided in the documentation handle encoding.<br/>' +
      '*Format:*<br>' +
      `\`
      [
        {
          "value": "global text fields search"
        },
        {
          "type": "isNull",
          "attribute": "createdById"
        },
        {
          "type": "bool",
          "attribute": "onlyMy"
        },
        {
          "type": "in",
          "attribute": "status",
          "value": ["New", "Assigned"]
        },
        {
          "type": "between",
          "attribute": "someNumberOrDateField",
          "value": [100, 200]
        }
      ]
      \`
    `,
  })
  @Type(() => ApiSearchParamWhereOptions)
  where?: ApiSearchParamWhereOptions[];

  @ApiPropertyOptional({
    description: 'An attribute to order by.',
  })
  order_by?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    enumName: 'ApiSearchParamOrderTypeEnum',
    description: "A direction of order: 'desc' or 'asc'.",
  })
  order?: 'asc' | 'desc' | 'ASC' | 'DESC' | 1 | -1;
}

export class ApiSearchOneParamOptions extends PartialType(
  OmitType(ApiSearchParamOptions, ['page', 'per_page'] as const),
) {}

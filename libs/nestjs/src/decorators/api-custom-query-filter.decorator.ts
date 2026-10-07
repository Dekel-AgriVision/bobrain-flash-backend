import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiQueryOptions } from '@nestjs/swagger';

export const SEARCH_FIELD_NAME = 'search';

export interface CustomQueryFilterOption {
  name: string;
  type?: string;
  isRange?: boolean;
  required?: boolean;
  description?: string;
  isArray?: boolean;
  enum?: any;
  enumName?: string;
  example?: any;
  isSearchField?: boolean;
  searchFields?: string[];
}

export type CustomQueryFilterParam = CustomQueryFilterOption | string;

const stringDescription =
  'By default, the match will be on the exact value. To search for a match on the keyword, add at the end of the value the character `|` followed by the keyword `like`.<br />Example: <br />_a=value_ <br />_a= value**|**like_';
const rangeDescription =
  'Recherche par intervalle. Les combinaisons possibles: <br />_a=value_ <br />_a=minValue**|**_ <br />_a=**|**maxValue_ <br />_a=minValue**|**maxValue_';

export const ApiCustomQueryFilter = (params: CustomQueryFilterParam[]) => {
  return applyDecorators(
    ...params.map((p) => {
      let options = {} as ApiQueryOptions;
      if (typeof p === 'string') {
        options = {
          ...options,
          name: p,
          type: 'string',
          required: false,
          description: stringDescription,
        };
      } else {
        let description: string;
        if (p.isRange === true) {
          description = rangeDescription;
        } else if (p.isSearchField === true) {
          description =
            'Recherche de mot-clé sur les champs suivants: ' +
            (p.searchFields || []).map((s) => '`' + s + '`').join(' ');
        } else {
          if (
            (p.type === undefined || p.type === 'string') &&
            p.enum === undefined &&
            p.isArray !== true
          ) {
            description = stringDescription;
          }
        }
        options = {
          ...options,
          required: p.required === true,
          type: p.type || 'string',
          name: p.name,
          isArray: p.isArray,
          enum: p.enum,
          enumName: p.enumName,
          example: p.example,
          description: description,
        };
      }
      return ApiQuery(options);
    }),
  );
};

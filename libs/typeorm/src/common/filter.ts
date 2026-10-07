import { toBoolean, toInteger } from '@app/core';
import {
  ApiSearchParamOptions,
  ApiSearchOneParamOptions,
  ApiSearchParamWhereOptions,
  ApiSearchParamWhereTypeEnum,
} from '@app/nestjs';
import _ from 'lodash';
import {
  Between,
  EntityMetadata,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsOrderValue,
  FindOptionsWhere,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MongoRepository,
  MoreThan,
  MoreThanOrEqual,
  Not,
  ObjectLiteral,
  Raw,
  Repository,
} from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import {
  getEntityPropertyColumnMeta,
  hasEntityPropertyPath,
  hasEntityPropertyRelationPath,
  hasEntityRelationPath,
  isEntityPropertyBooleanColumn,
  isEntityPropertyDateTimeColumn,
} from './helpers';
import { plainToInstance } from 'class-transformer';

export type SearchParamFilterOptions = {
  textFilterFields?: string[];
  mappedFields?: Record<string, string>;
};

/**
 * Build findManyOptions or FindOneOtions from ApiSearchParamOptions or ApiSearchOneParamOptions
 */
export const buildFilterFromApiSearchParams = <Entity extends ObjectLiteral>(
  repository: Repository<Entity> | MongoRepository<Entity>,
  searchParams?: ApiSearchParamOptions | ApiSearchOneParamOptions | string,
  options?: SearchParamFilterOptions,
): FindManyOptions<Entity> | FindOneOptions<Entity> => {
  options = options || ({} as SearchParamFilterOptions);
  options.mappedFields = options?.mappedFields || {};
  options.textFilterFields = options?.textFilterFields || [];

  if (typeof searchParams === 'string') {
    searchParams = JSON.parse(searchParams);
  }

  // searchParams cast
  if (
    !(searchParams instanceof ApiSearchParamOptions) &&
    !(searchParams instanceof ApiSearchOneParamOptions)
  ) {
    if (
      (searchParams as any)?.hasOwnProperty('page') ||
      (searchParams as any)?.hasOwnProperty('per_page')
    ) {
      searchParams = plainToInstance(
        ApiSearchParamOptions,
        searchParams as ApiSearchParamOptions,
        {
          enableImplicitConversion: true,
        },
      );
    } else {
      searchParams = plainToInstance(
        ApiSearchOneParamOptions,
        searchParams as ApiSearchOneParamOptions,
        {
          enableImplicitConversion: true,
        },
      );
    }
  }

  // Clean condition
  let conditions: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] =
    buildFindConditions(repository.metadata, searchParams.where, options);
  if (Array.isArray(conditions)) {
    if (conditions.length <= 0) {
      conditions = {};
    } else if (conditions.length === 1) {
      conditions = conditions[0];
    }
  }

  let { select, relations } = buildSelectFindOptions(
    repository.metadata,
    searchParams?.select,
    options.mappedFields,
  );

  relations = _.merge(
    relations,
    buildRelationsOptions(
      repository.metadata,
      searchParams?.relations,
      options.mappedFields,
    ),
  );

  // Inject primary column select if select not empty
  if (!_.isEmpty(select)) {
    select = _.merge(select, getEntityPrimarySelect(repository.metadata));
  }

  const findOptions: FindManyOptions<Entity> | FindOneOptions<Entity> = {
    relations: relations,
    select: select,
    where: conditions,
    order: buidFindOrderOptions(
      repository.metadata,
      searchParams?.order_by,
      searchParams?.order,
    ),
  };

  // Pagination options
  if (searchParams instanceof ApiSearchParamOptions) {
    const perPage =
      searchParams.per_page ??
      toInteger(process.env.APP_PAGINATION_PER_PAGE, 25);
    if (perPage > 0) {
      (findOptions as any)['take'] = perPage;
      if (searchParams?.page ?? undefined) {
        const page = searchParams.page;
        if (page > 0) {
          (findOptions as any)['skip'] = perPage * (page - 1);
        }
      }
    }
  }

  return _.pickBy(
    findOptions,
    (value: any) =>
      (typeof value === 'object' && !_.isEmpty(value)) ||
      (typeof value !== 'object' && value),
  );
};

/**
 * Get primary columns select
 */
export function getEntityPrimarySelect(meta: EntityMetadata): any {
  let buitSelect = {} as any;
  (meta.primaryColumns || []).forEach((columnMeta: ColumnMetadata) => {
    buitSelect = _.set(buitSelect, columnMeta.propertyName, true);
  });
  return buitSelect;
}

/**
 * Build find options order
 */
export function buidFindOrderOptions<Entity extends ObjectLiteral>(
  meta: EntityMetadata,
  orderBy?: string,
  order?: FindOptionsOrderValue,
): FindOptionsOrder<Entity> {
  let builtOrderOptions = {} as FindOptionsOrder<Entity>;
  orderBy = orderBy || '';
  if (hasEntityPropertyPath(meta, orderBy)) {
    builtOrderOptions = _.set(
      builtOrderOptions,
      orderBy,
      (toInteger(String(order)) ?? order ?? 'ASC') as FindOptionsOrderValue,
    );
  }
  return builtOrderOptions;
}

// Get select and relations find options
export function buildSelectFindOptions(
  meta: EntityMetadata,
  select?: string | string[],
  mappedFields?: Record<string, string>,
): { select: any; relations: any } {
  if (typeof select === 'string') {
    select = select.split(',');
  } else {
    select = select || [];
  }
  mappedFields = mappedFields || {};
  let builtSelect = {} as any;
  let builtRelations = {} as any;
  select.forEach((path) => {
    const propertyPath = mappedFields[path] || path;
    if (hasEntityPropertyPath(meta, propertyPath)) {
      builtSelect = _.set(builtSelect, propertyPath, true);
      const splittedPath = propertyPath.split('.');
      if (splittedPath.length > 1) {
        if (hasEntityPropertyRelationPath(meta, propertyPath)) {
          builtRelations = _.set(
            builtRelations,
            splittedPath.slice(0, -1).join('.'),
            true,
          );
        }
      }
    } else if (hasEntityRelationPath(meta, propertyPath)) {
      builtRelations = _.set(builtRelations, propertyPath, true);
    }
  });
  return { select: builtSelect, relations: builtRelations };
}

// Get relations find options
export function buildRelationsOptions(
  meta: EntityMetadata,
  relations?: string | string[],
  mappedFields?: Record<string, string>,
): any {
  if (typeof relations === 'string') {
    relations = relations.split(',');
  } else {
    relations = relations || [];
  }
  mappedFields = mappedFields || {};
  let builtRelations = {} as any;
  relations.forEach((path) => {
    const propertyPath = mappedFields[path] || path;
    if (hasEntityRelationPath(meta, propertyPath)) {
      builtRelations = _.set(builtRelations, propertyPath, true);
    }
  });
  return builtRelations;
}

/**
 * Build find options where conditions
 */
function buildFindConditions<Entity extends ObjectLiteral>(
  meta: EntityMetadata,
  searchParamsWhere?: ApiSearchParamWhereOptions[] | string,
  options?: SearchParamFilterOptions,
): FindOptionsWhere<Entity>[] {
  options = options || ({} as SearchParamFilterOptions);
  options.mappedFields = options?.mappedFields || {};
  options.textFilterFields = options?.textFilterFields || [];
  if (typeof searchParamsWhere === 'string') {
    searchParamsWhere = JSON.parse(
      searchParamsWhere,
    ) as ApiSearchParamWhereOptions[];
  }

  let findConditions = [] as FindOptionsWhere<Entity>[];
  let primaryConditions = {} as FindOptionsWhere<Entity>;
  (searchParamsWhere || []).forEach((param) => {
    if (Object.keys(param).length <= 0) return;

    // Process recursive call for 'or' type
    if (
      param?.type === ApiSearchParamWhereTypeEnum.or &&
      Array.isArray(param.value) &&
      param.value.length > 0
    ) {
      findConditions.push(
        ...buildFindConditions(
          meta,
          param.value as ApiSearchParamWhereOptions[],
          options,
        ),
      );
      return;
    }

    // Check default text filter field
    if (
      !param.attribute &&
      !param.type &&
      typeof param.value === 'string' &&
      param.value.length > 0
    ) {
      primaryConditions = {
        ...primaryConditions,
        ...formatDefaultFilterConditions(
          meta,
          param,
          options.textFilterFields || [],
        ),
      };
      return;
    }

    // Check attribute and type in param
    if (
      (!param.attribute && !param.type) ||
      !(typeof param.attribute === 'string')
    )
      return;

    // get property columnMetadata if exists
    const propertyPath: string = options?.mappedFields
      ? options?.mappedFields[param.attribute] || param.attribute
      : param.attribute;
    const columnMetadata = getEntityPropertyColumnMeta(meta, propertyPath);
    if (!columnMetadata) return;

    // Build optionsWhere for any case
    primaryConditions = {
      ...primaryConditions,
      ...formatSimpleParamValueConditions(param, propertyPath, columnMetadata),
      ...formatEmptyParamValueConditions(param, propertyPath, columnMetadata),
      ...formatIntervalParamValueConditions(
        param,
        propertyPath,
        columnMetadata,
      ),
      ...formatArrayParamValueConditions(param, propertyPath, columnMetadata),
    };
  });
  findConditions.unshift(primaryConditions);
  findConditions = findConditions.filter((f) => !_.isEmpty(f));
  return findConditions;
}

/**
 * Format default fields filter
 */
function formatDefaultFilterConditions<Entity extends ObjectLiteral>(
  meta: EntityMetadata,
  param: ApiSearchParamWhereOptions,
  textFilterFields?: string[],
): FindOptionsWhere<Entity> {
  let conditions = {} as FindOptionsWhere<Entity>;
  // Check default text filter field
  if (
    !param.type &&
    !param.attribute &&
    typeof param.value === 'string' &&
    param.value.length > 0
  ) {
    textFilterFields = (textFilterFields || []).filter((field) =>
      hasEntityPropertyPath(meta, field),
    );
    if (textFilterFields.length > 0) {
      // Add default text filter field
      conditions = {
        ...conditions,
        [textFilterFields[0]]: Raw(
          (alias: string) => {
            const prefix = alias.split('.')[0];
            return (
              '(' +
              textFilterFields
                .map(
                  (field) => `${prefix}.${field} LIKE :textFilterFieldsValue`,
                )
                .join(' OR ') +
              ')'
            );
          },
          { textFilterFieldsValue: `%${param.value}%` },
        ),
      };
    }
  }
  return conditions;
}

/**
 * Format one value param
 */
function formatSimpleParamValueConditions<Entity extends ObjectLiteral>(
  param: ApiSearchParamWhereOptions,
  propertyName: string,
  columnMeta: ColumnMetadata,
): FindOptionsWhere<Entity> {
  let conditions = {} as FindOptionsWhere<Entity>;
  if (typeof param.value === 'undefined' || typeof param.value === 'object')
    return conditions;

  param.type = param.type ?? ApiSearchParamWhereTypeEnum.equals;

  switch (param.type as ApiSearchParamWhereTypeEnum) {
    case ApiSearchParamWhereTypeEnum.equals:
    case ApiSearchParamWhereTypeEnum.notEquals:
      if (isEntityPropertyDateTimeColumn(columnMeta)) {
        param.value = Raw(
          (alias: string) =>
            `DATE(${alias}) = DATE(:${_.camelCase(columnMeta.propertyPath)})`,
          { [_.camelCase(columnMeta.propertyPath)]: param.value },
        );
      } else if (isEntityPropertyBooleanColumn(columnMeta)) {
        param.value = toBoolean(String(param.value)) ?? param.value;
      }
      if (param.type === ApiSearchParamWhereTypeEnum.notEquals) {
        conditions = _.set(conditions, propertyName, Not(param.value));
      } else {
        conditions = _.set(conditions, propertyName, param.value);
      }
      break;
    case ApiSearchParamWhereTypeEnum.greaterThan:
      if (isEntityPropertyDateTimeColumn(columnMeta)) {
        param.value = Raw(
          (alias: string) =>
            `DATE(${alias}) > DATE(:${_.camelCase(columnMeta.propertyPath)})`,
          { [_.camelCase(columnMeta.propertyPath)]: param.value },
        );
      } else {
        param.value = MoreThan(param.value);
      }
      conditions = _.set(conditions, propertyName, param.value);
      break;
    case ApiSearchParamWhereTypeEnum.greaterThanOrEquals:
      conditions = _.set(
        conditions,
        propertyName,
        MoreThanOrEqual(param.value),
      );
      break;
    case ApiSearchParamWhereTypeEnum.lessThan:
      conditions = _.set(conditions, propertyName, LessThan(param.value));
      break;
    case ApiSearchParamWhereTypeEnum.lessThanOrEquals:
      if (isEntityPropertyDateTimeColumn(columnMeta)) {
        param.value = Raw(
          (alias: string) =>
            `DATE(${alias}) <= DATE(:${_.camelCase(columnMeta.propertyPath)})`,
          { [_.camelCase(columnMeta.propertyPath)]: param.value },
        );
      } else {
        param.value = LessThanOrEqual(param.value);
      }
      conditions = _.set(conditions, propertyName, param.value);
      break;
    case ApiSearchParamWhereTypeEnum.like:
    case ApiSearchParamWhereTypeEnum.contains:
      conditions = _.set(conditions, propertyName, Like(`%${param.value}%`));
      break;
    case ApiSearchParamWhereTypeEnum.notLike:
    case ApiSearchParamWhereTypeEnum.notContains:
      conditions = _.set(
        conditions,
        propertyName,
        Not(Like(`%${param.value}%`)),
      );
      break;
    case ApiSearchParamWhereTypeEnum.startsWith:
      conditions = _.set(conditions, propertyName, Like(`${param.value}%`));
      break;
    case ApiSearchParamWhereTypeEnum.endsWith:
      conditions = _.set(conditions, propertyName, Like(`%${param.value}`));
      break;
    case ApiSearchParamWhereTypeEnum.lastXDays:
      if (
        ~['mysql', 'mariadb'].indexOf(
          columnMeta.entityMetadata.connection.options.type,
        )
      ) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw(
            (alias: string) =>
              `DATEDIFF(NOW(), ${alias}) BETWEEN 0 AND :lastXDays`,
            {
              lastXDays: param.value,
            },
          ),
        );
      }
      break;
    case ApiSearchParamWhereTypeEnum.nextXDays:
      if (
        ~['mysql', 'mariadb'].indexOf(
          columnMeta.entityMetadata.connection.options.type,
        )
      ) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw(
            (alias: string) =>
              `DATEDIFF(${alias}, NOW()) BETWEEN 1 AND :nextXDays`,
            {
              nextXDays: param.value,
            },
          ),
        );
      }
      break;
    case ApiSearchParamWhereTypeEnum.olderThanXDays:
      if (
        ~['mysql', 'mariadb'].indexOf(
          columnMeta.entityMetadata.connection.options.type,
        )
      ) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw(
            (alias: string) => `DATEDIFF(NOW(), ${alias}) > :olderThanXDays`,
            {
              olderThanXDays: param.value,
            },
          ),
        );
      }
      break;
    case ApiSearchParamWhereTypeEnum.afterXDays:
      if (
        ~['mysql', 'mariadb'].indexOf(
          columnMeta.entityMetadata.connection.options.type,
        )
      ) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw((alias: string) => `DATEDIFF(${alias}, NOW()) > :afterXDays`, {
            afterXDays: param.value,
          }),
        );
      }
      break;
  }
  return conditions;
}

/**
 * Format interval value param
 */
function formatIntervalParamValueConditions<Entity extends ObjectLiteral>(
  param: ApiSearchParamWhereOptions,
  propertyName: string,
  columnMeta: ColumnMetadata,
): FindOptionsWhere<Entity> {
  let conditions = {} as FindOptionsWhere<Entity>;
  if (!Array.isArray(param.value) || param.value.length !== 2)
    return conditions;
  switch (param.type as ApiSearchParamWhereTypeEnum) {
    case ApiSearchParamWhereTypeEnum.between:
      if (isEntityPropertyDateTimeColumn(columnMeta)) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw(
            (alias: string) =>
              `DATE(${alias}) BETWEEN DATE(:${_.camelCase(
                columnMeta.propertyPath,
              )}1) AND  DATE(:${_.camelCase(columnMeta.propertyPath)}2)`,
            {
              [_.camelCase(columnMeta.propertyPath) + '1']: param.value[0],
              [_.camelCase(columnMeta.propertyPath) + '2']: param.value[1],
            },
          ),
        );
      } else {
        conditions = _.set(
          conditions,
          propertyName,
          Between(param.value[0], param.value[1]),
        );
      }
      break;
  }
  return conditions;
}

/**
 * Format array value param
 */
function formatArrayParamValueConditions<Entity extends ObjectLiteral>(
  param: ApiSearchParamWhereOptions,
  propertyName: string,
  columnMeta: ColumnMetadata,
): FindOptionsWhere<Entity> {
  let conditions = {} as FindOptionsWhere<Entity>;
  if (!Array.isArray(param.value) || param.value.length <= 0) return conditions;
  switch (param.type as ApiSearchParamWhereTypeEnum) {
    case ApiSearchParamWhereTypeEnum.in:
    case ApiSearchParamWhereTypeEnum.notIn:
      if (isEntityPropertyDateTimeColumn(columnMeta)) {
        const value = param.value || [];
        param.value = Raw(
          (alias: string) =>
            `DATE(${alias}) IN (${value
              .map(
                (_v: any, i: number) =>
                  'DATE(:' + _.camelCase(columnMeta.propertyPath) + i + ')',
              )
              .join(',')})`,
          {
            ...value.reduce((previous: any, current: any, i: number) => {
              return {
                ...previous,
                [_.camelCase(columnMeta.propertyPath) + i]: current,
              };
            }, {}),
          },
        );
      } else {
        param.value = In(param.value);
      }
      if (param.type === ApiSearchParamWhereTypeEnum.notIn) {
        conditions = _.set(conditions, propertyName, Not(param.value));
      } else {
        conditions = _.set(conditions, propertyName, param.value);
      }
      break;
  }
  return conditions;
}

/**
 * Format no value param
 */
function formatEmptyParamValueConditions<Entity extends ObjectLiteral>(
  param: ApiSearchParamWhereOptions,
  propertyName: string,
  columnMeta: ColumnMetadata,
): FindOptionsWhere<Entity> {
  let conditions = {} as FindOptionsWhere<Entity>;
  switch (param.type as ApiSearchParamWhereTypeEnum) {
    case ApiSearchParamWhereTypeEnum.isTrue:
      conditions = _.set(conditions, propertyName, true);
      break;
    case ApiSearchParamWhereTypeEnum.isFalse:
      conditions = _.set(conditions, propertyName, false);
      break;
    case ApiSearchParamWhereTypeEnum.isNull:
      conditions = _.set(conditions, propertyName, IsNull());
      break;
    case ApiSearchParamWhereTypeEnum.isNotNull:
      conditions = _.set(conditions, propertyName, Not(IsNull()));
      break;
    case ApiSearchParamWhereTypeEnum.today:
      conditions = _.set(
        conditions,
        propertyName,
        Raw((alias: string) => `DATE(${alias}) = DATE(NOW())`),
      );
      break;
    case ApiSearchParamWhereTypeEnum.past:
      conditions = _.set(
        conditions,
        propertyName,
        Raw((alias: string) => `DATE(${alias}) < DATE(NOW())`),
      );
      break;
    case ApiSearchParamWhereTypeEnum.future:
      conditions = _.set(
        conditions,
        propertyName,
        Raw((alias: string) => `DATE(${alias}) > DATE(NOW())`),
      );
      break;
    case ApiSearchParamWhereTypeEnum.lastSevenDays:
      if (
        ~['mysql', 'mariadb'].indexOf(
          columnMeta.entityMetadata.connection.options.type,
        )
      ) {
        conditions = _.set(
          conditions,
          propertyName,
          Raw((alias: string) => `DATEDIFF(NOW(), ${alias}) BETWEEN 0 AND 7`),
        );
      }
      break;
    case ApiSearchParamWhereTypeEnum.currentMonth:
      // conditions = _.set(conditions, propertyName, Raw((alias) => `DATEDIFF(NOW(), ${alias}) <= 7`));
      break;
    case ApiSearchParamWhereTypeEnum.lastMonth:
      // conditions = _.set(conditions, propertyName, Raw((alias) => `DATEDIFF(NOW(), ${alias}) <= 7`));
      break;
    case ApiSearchParamWhereTypeEnum.nextMonth:
      // conditions = _.set(conditions, propertyName, Raw((alias) => `DATEDIFF(NOW(), ${alias}) <= 7`));
      break;
    case ApiSearchParamWhereTypeEnum.currentYear:
      // conditions = _.set(conditions, propertyName, Raw((alias) => `DATEDIFF(NOW(), ${alias}) <= 7`));
      break;
    case ApiSearchParamWhereTypeEnum.lastYear:
      // conditions = _.set(conditions, propertyName, Raw((alias) => `DATEDIFF(NOW(), ${alias}) <= 7`));
      break;
  }

  return conditions;
}

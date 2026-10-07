import { ColumnType, EntityMetadata } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

/**
 * Get column metadata for a given property path
 */
export function getEntityPropertyColumnMeta(
  meta: EntityMetadata,
  propertyPath: string,
): ColumnMetadata {
  const splittedPath = propertyPath.split('.');
  const i = 0;

  // Check root column path
  if (~meta.ownColumns.map((c) => c.propertyName).indexOf(splittedPath[i])) {
    return meta.findColumnWithPropertyName(splittedPath[i]);
  } else if (
    ~meta.ownColumns.map((c) => c.propertyAliasName).indexOf(splittedPath[i])
  ) {
    return meta.findColumnWithDatabaseName(splittedPath[i]);
  }

  // Check Nested property value
  if (typeof splittedPath[i + 1] === 'string') {
    // Check embedded column path
    if (~meta.embeddeds.map((c) => c.propertyName).indexOf(splittedPath[i])) {
      return getEntityPropertyColumnMeta(
        meta.findEmbeddedWithPropertyPath(splittedPath[i]).entityMetadata,
        splittedPath.slice(i + 1).join('.'),
      );
    }

    // Check relation column path
    if (
      ~meta.ownRelations.map((c) => c.propertyName).indexOf(splittedPath[i])
    ) {
      return getEntityPropertyColumnMeta(
        meta.findRelationWithPropertyPath(splittedPath[i])
          .inverseEntityMetadata,
        splittedPath.slice(i + 1).join('.'),
      );
    }
  }

  // Check inheritance parent column path
  if (meta.parentEntityMetadata) {
    return getEntityPropertyColumnMeta(meta.parentEntityMetadata, propertyPath);
  }

  return undefined;
}

/**
 * Check if a given property path exists
 */
export function hasEntityPropertyPath(
  meta: EntityMetadata,
  propertyPath: string,
): boolean {
  return getEntityPropertyColumnMeta(meta, propertyPath) !== undefined;
}

/**
 * Get entity relation metadata for given propertyPath
 */
export function getEntityRelationMeta(
  meta: EntityMetadata,
  propertyPath: string,
): RelationMetadata {
  const splittedPath = propertyPath.split('.');
  const i = 0;
  const relationNames = meta.ownRelations.map((c) => c.propertyName);

  // Check ownRelations property
  if (!~relationNames.indexOf(splittedPath[i])) {
    return undefined;
  }

  // Check Nested property value
  if (typeof splittedPath[i + 1] === 'string') {
    return getEntityRelationMeta(
      meta.findRelationWithPropertyPath(splittedPath[i]).inverseEntityMetadata,
      splittedPath.slice(i + 1).join('.'),
    );
  } else {
    return meta.findRelationWithPropertyPath(splittedPath[i]);
  }
}

/**
 * Check if a given relation property path exists
 */
export function hasEntityRelationPath(
  meta: EntityMetadata,
  propertyPath: string,
): boolean {
  return getEntityRelationMeta(meta, propertyPath) !== undefined;
}

/**
 * Get entity relation meta for un given property path.
 * Unlike 'getEntityRelationMeta', this returns also if property path is column and has relation parent
 */
export function getEntityPropertyRelationMeta(
  meta: EntityMetadata,
  propertyPath: string,
): RelationMetadata {
  const relationMeta = getEntityRelationMeta(meta, propertyPath);
  if (relationMeta) {
    return relationMeta;
  }
  const columnMeta = getEntityPropertyColumnMeta(meta, propertyPath);
  if (columnMeta) {
    const splittedPath = propertyPath.split('.');
    if (splittedPath.length < 2) return undefined;
    return getEntityRelationMeta(meta, splittedPath.slice(0, -1).join('.'));
  }
  return undefined;
}

/**
 * Check if a given relation property path exists.
 * Unlike 'hasEntityRelationPath', this checks also if property path is column and has relation parent
 */
export function hasEntityPropertyRelationPath(
  meta: EntityMetadata,
  propertyPath: string,
): boolean {
  return getEntityPropertyRelationMeta(meta, propertyPath) !== undefined;
}

export function isEntityPropertyDateTimeColumn(meta: ColumnMetadata) {
  return ~(
    ['datetime', 'datetime2', 'timestamp', 'datetimeoffset'] as ColumnType[]
  ).indexOf(meta.type);
}

export function isEntityPropertyBooleanColumn(meta: ColumnMetadata) {
  return ~(['boolean'] as ColumnType[]).indexOf(meta.type);
}

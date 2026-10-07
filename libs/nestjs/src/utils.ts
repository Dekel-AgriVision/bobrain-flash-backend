import {
  InternalServerErrorException,
  NotFoundException,
  ValidationError,
} from '@nestjs/common';

export function catchError(error: unknown): void {
  if (error?.constructor?.name === 'EntityNotFoundError') {
    throw new NotFoundException(error, 'Resource not found');
  } else {
    throw new InternalServerErrorException(error, 'Internal Error');
  }
}

export function formatValidationErrors(
  validationErrors?: ValidationError[],
): any {
  const errors = {} as any;
  let error;

  const formatConstraints = (constraints: any): string[] => {
    const result = [];
    for (const constraint in constraints) {
      if (Object.prototype.hasOwnProperty.call(constraints, constraint)) {
        result.push(constraints[constraint]);
      }
    }
    return result;
  };

  let children;

  for (const validationError of validationErrors) {
    if (
      Array.isArray(validationError.children) &&
      validationError.children.length > 0
    ) {
      error = {} as any;
      children = formatValidationErrors(validationError.children);
      for (const child in children) {
        if (Object.prototype.hasOwnProperty.call(children, child)) {
          error[validationError.property + '.' + child] = children[child];
        }
      }
      Object.assign(errors, error);
    } else {
      errors[validationError.property] = formatConstraints(
        validationError.constraints,
      );
    }
  }
  return errors;
}

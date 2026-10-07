import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BaseEntity, Not, ObjectLiteral, Repository } from 'typeorm';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import _ from 'lodash';

export type UniqueValidationOptions = {
  target?: any;
  property?: string;
  withFields?: string[];
  paramNames?: any;
};

@ValidatorConstraint({ name: 'IsUnique', async: true })
class IsUniqueConstraint implements ValidatorConstraintInterface {
  defaultMessage(/* validationArguments?: ValidationArguments */): string {
    return 'Cet élément "$value" existe déjà.';
  }

  async validate(value: unknown, args?: ValidationArguments): Promise<boolean> {
    if (value === undefined || value == null) return true;
    const uniqueOptions = args.constraints[0] as UniqueValidationOptions;
    const entityType = uniqueOptions.target as typeof BaseEntity;
    const repository = entityType.getRepository();

    const count = await repository.countBy(
      this.buildConditions(value, args, repository, uniqueOptions),
    );

    return !count;
  }

  private buildConditions(
    value: unknown,
    args: ValidationArguments,
    repository: Repository<ObjectLiteral>,
    uniqueOptions: UniqueValidationOptions,
  ): any {
    return {
      [uniqueOptions.property]: value,
      ...this.buildWithFieldsConditions(args.object, uniqueOptions.withFields),
      ...this.buildPrimaryColumnConditions(
        args.object,
        repository,
        uniqueOptions,
      ),
    };
  }

  private buildWithFieldsConditions(
    object: ObjectLiteral,
    withFields?: string[],
  ): any {
    if (!Array.isArray(withFields) || !withFields.length) {
      return {};
    }
    const request = getCurrentRequest();
    return withFields.reduce(
      (previous, current) => ({
        ...previous,
        ...(object[current] || request.params[current]
          ? { [current]: object[current] || request.params[current] }
          : {}),
      }),
      {},
    );
  }

  private buildPrimaryColumnConditions(
    object: ObjectLiteral,
    repository: Repository<ObjectLiteral>,
    uniqueOptions: UniqueValidationOptions,
  ): any {
    const primaryColumnNames = repository.metadata.primaryColumns.map(
      ({ propertyName }) => propertyName,
    );
    if (!primaryColumnNames.length) {
      return {};
    }

    return this.getPrimaryColumnValueConditions(
      object,
      primaryColumnNames,
      uniqueOptions,
    );
  }

  private getPrimaryColumnValueConditions(
    object: ObjectLiteral,
    primaryColumnNames: string[],
    uniqueOptions: UniqueValidationOptions,
  ): any {
    const request = getCurrentRequest();
    const result: any = {};
    let paramValue: any;
    for (const name of primaryColumnNames) {
      paramValue =
        request.params[uniqueOptions.paramNames[name]] ||
        request.params[
          _.camelCase([uniqueOptions.target.constructor.name, name].join('_'))
        ] ||
        request.params[
          _.camelCase([object.constructor.name, name].join('_'))
        ] ||
        request.params[name] ||
        object[name];

      if (paramValue !== undefined && paramValue != null) {
        result[name] = Not(paramValue);
      }
    }
    return result;
  }
}

export const IsUnique = (
  uniqueValidationOptions?: UniqueValidationOptions,
  validationOptions?: ValidationOptions,
) => {
  return function (object: any, propertyName: string): void {
    const uniqueOptions =
      uniqueValidationOptions || ({} as UniqueValidationOptions);
    uniqueOptions.withFields = uniqueOptions.withFields || [];
    uniqueOptions.target = uniqueOptions.target || object.constructor;
    uniqueOptions.property = uniqueOptions.property || propertyName;
    uniqueOptions.paramNames = uniqueOptions.property || {};
    registerDecorator({
      name: 'IsUnique',
      propertyName: uniqueOptions.property,
      async: true,
      target: object as typeof BaseEntity,
      constraints: [uniqueOptions],
      options: validationOptions,
      validator: IsUniqueConstraint,
    });
  };
};

let request: Request;
const getCurrentRequest = (): Request => {
  return request;
};

export class IsUniqueConstraintRequestInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    request = context.switchToHttp().getRequest();
    return next.handle();
  }
}

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BaseEntity, ObjectLiteral } from 'typeorm';

export type ExistsValidationOptions = {
  target: any;
  property?: string;
  withFields?: string[];
};

@ValidatorConstraint({ name: 'Exists', async: true })
class ExistsConstraint implements ValidatorConstraintInterface {
  defaultMessage(/* validationArguments?: ValidationArguments */): string {
    return 'Cet élément "$value" n\'existe pas.';
  }

  async validate(value: unknown, args?: ValidationArguments): Promise<boolean> {
    if (value === undefined || value == null) return true;
    const existsOptions = args.constraints[0] as ExistsValidationOptions;
    const entityType = existsOptions.target as typeof BaseEntity;
    const repository = entityType.getRepository();
    const exists = await repository.countBy(
      this.buildConditions(value, args, existsOptions),
    );

    return exists > 0;
  }

  private buildConditions(
    value: unknown,
    args: ValidationArguments,
    existsOptions: ExistsValidationOptions,
  ): any {
    return {
      [existsOptions.property]: value,
      ...this.buildWithFieldsConditions(args.object, existsOptions.withFields),
    };
  }

  private buildWithFieldsConditions(
    object: ObjectLiteral,
    withFields?: string[],
  ): any {
    if (!Array.isArray(withFields) || !withFields.length) {
      return {};
    }
    return withFields.reduce(
      (previous, current) => ({
        ...previous,
        [current]: object[current],
      }),
      {},
    );
  }
}

export const Exists = (
  existsValidationOptions?: ExistsValidationOptions,
  validationOptions?: ValidationOptions,
) => {
  return function (object: any, propertyName: string): void {
    const existsOptions =
      existsValidationOptions || ({} as ExistsValidationOptions);
    existsOptions.withFields = existsOptions.withFields || [];
    existsOptions.property = existsOptions.property || 'id';
    registerDecorator({
      name: 'Exists',
      propertyName,
      async: true,
      target: object as typeof BaseEntity,
      constraints: [existsOptions],
      options: validationOptions,
      validator: ExistsConstraint,
    });
  };
};

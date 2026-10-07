import {
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationPipeOptions } from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { InvalidBodyFieldException } from '../exceptions';
import { formatValidationErrors } from '../utils';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super(
      Object.assign(
        {
          whitelist: true,
          errorHttpStatusCode:
            process.env.BSTR_VALIDATION_PIPE_ERROR_HTTP_STATUS_CODE ||
            HttpStatus.UNPROCESSABLE_ENTITY,
        },
        options,
      ),
    );
  }

  createExceptionFactory(): (validationErrors?: ValidationError[]) => unknown {
    return (validationErrors: ValidationError[] = []) => {
      if (this.isDetailedOutputDisabled) {
        return new HttpErrorByCode[this.errorHttpStatusCode]();
      }
      const errors = formatValidationErrors(validationErrors);
      return new InvalidBodyFieldException([errors]);
    };
  }
}

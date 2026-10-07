import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  CAN_HAVE_OPTIONAL_OTP_META_KEY,
  REQUEST_OTP_CODE_KEY,
  REQUEST_USER_CODE_HEADER,
} from '../definitions/constants';

/**
 * Check OTP access resource
 */
@Injectable()
export class OtpGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;

    // Check 'user-code' header. It's OTP Code
    const otpCode = request.header(REQUEST_USER_CODE_HEADER) as string;
    // Check optional otp resource access
    const canHaveOptionalOtp = this.reflector.getAllAndOverride<boolean>(
      CAN_HAVE_OPTIONAL_OTP_META_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!canHaveOptionalOtp) {
      if (
        otpCode === undefined ||
        otpCode == null ||
        typeof otpCode !== 'string' ||
        otpCode.trim().length <= 0
      ) {
        throw new ForbiddenException(
          `Impossible de trouver un code OTP dans la requête`,
        );
      }
    }

    // Add 'user-code' to request object
    request[REQUEST_OTP_CODE_KEY] = otpCode as string;

    return true;
  }
}

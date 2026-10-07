import { HttpException } from '@nestjs/common';

export class LockedException extends HttpException {
  constructor(message?: any) {
    super(message || 'Locked', 423);
  }
}

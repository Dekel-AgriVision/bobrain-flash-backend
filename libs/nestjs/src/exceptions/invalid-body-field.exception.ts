import { BadRequestException } from '@nestjs/common';

export class InvalidBodyFieldException extends BadRequestException {}

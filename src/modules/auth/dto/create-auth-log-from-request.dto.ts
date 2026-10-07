import { PartialType, PickType } from '@nestjs/swagger';
import { AuthLog } from 'src/core/entities/session/auth-log.entity';

export class CreateAuthLogFromRequestDto extends PartialType(
  PickType(AuthLog, [
    'username',
    'authMethod',
    'isDenied',
    'applicationId',
  ] as const),
) {}

import { All, Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsAnonymous } from './modules/auth/decorators/is-anonymous.decorator';

@IsAnonymous()
@ApiExcludeController()
@Controller('')
export class AppController {
  @All('api/v1/alive')
  aliveLegacy(): string {
    return 'yes';
  }

  @All('alive')
  alive(): any {
    return 'yes';
  }
}

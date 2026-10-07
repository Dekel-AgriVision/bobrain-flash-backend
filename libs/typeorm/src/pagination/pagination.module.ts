import { Module } from '@nestjs/common';
import { PaginatedService } from './paginated.service';

@Module({
  providers: [PaginatedService],
  exports: [PaginatedService],
})
export class PaginationModule {}

import { ApiProperty } from '@nestjs/swagger';

export class Paginated<TModel> {
  @ApiProperty({
    description:
      'Determine the total number of matching items in the data store.',
  })
  total: number;
  @ApiProperty({ description: 'The number of items to be shown per page.' })
  per_page: number;
  @ApiProperty({ description: 'Get the current page number.' })
  current_page: number;
  @ApiProperty({
    description: 'Get the page number of the last available page.',
  })
  last_page: number;
  @ApiProperty({ description: 'Get the items start index.' })
  from: number;
  @ApiProperty({ description: 'Get the items end index.' })
  to: number;
  @ApiProperty({ description: 'Get array of items' })
  data: TModel[];
}

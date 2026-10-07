import { Paginated } from './paginated';

export interface PaginatedInterface<TModel> {
  paginate(
    repository: any,
    page?: number,
    per_page?: number,
    conditions?: any,
    options?: any,
  ): Promise<Paginated<TModel>>;
}

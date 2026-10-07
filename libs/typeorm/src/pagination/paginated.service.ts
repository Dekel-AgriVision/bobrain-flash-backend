import { PaginatedInterface } from '@app/nestjs';
import { Paginated } from '@app/nestjs';
import { Injectable } from '@nestjs/common';
import { toInteger } from '@app/core';
import { FindManyOptions, MongoRepository, Repository } from 'typeorm';

@Injectable()
export class PaginatedService<Entity> implements PaginatedInterface<Entity> {
  /**
   *
   * @param repository Repository<Entity> | MongoRepository<Entity>
   * @param page number
   * @param per_page number
   * @param options FindManyOptions default {}
   * @return Promise<Paginated<Entity>>
   */
  async paginate(
    repository: Repository<Entity> | MongoRepository<Entity>,
    page?: number,
    per_page?: number,
    options?: FindManyOptions<Entity>,
  ): Promise<Paginated<Entity>> {
    per_page =
      per_page ??
      options.take ??
      toInteger(process.env.APP_PAGINATION_PER_PAGE, 25);
    per_page = toInteger(String(per_page));

    if (typeof page === undefined || page == null) {
      if (typeof options.skip === 'number') {
        page = Math.ceil((options.skip + 1) / per_page);
      }
    }
    page = toInteger(String(page), 1);
    let skip = 0;
    if (page <= 0) page = 1;
    let paginationOptions = {} as any;
    if (per_page > 0) {
      skip = (page - 1) * per_page;
      paginationOptions = { skip: skip } as any;
      paginationOptions['take'] = per_page;
    } else {
      per_page = 0;
    }
    options = options ?? {};
    // eslint-disable-next-line prefer-const
    let [paginatedEntities, totalCount] = await repository?.findAndCount({
      ...options,
      ...paginationOptions,
    });

    let from: number, to: number;
    if (skip > totalCount) {
      from = 0;
      to = 0;
      paginatedEntities = [] as Entity[];
    } else {
      from = skip + 1;
      to =
        skip + per_page > totalCount || per_page === 0
          ? totalCount
          : skip + per_page;
    }
    /*
     skip <= totalCount && skip + per_page > totalCount ? totalCount : skip + per_page,
     */
    return {
      total: totalCount,
      per_page: per_page,
      current_page: page,
      last_page: per_page > 0 ? Math.ceil(totalCount / per_page) : 1,
      from: from,
      to: to,
      data: paginatedEntities,
    };
  }
}

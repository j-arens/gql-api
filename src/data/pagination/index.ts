import { ObjectType, Field, Int } from "type-graphql";
import { getRepository } from "typeorm";
import { PaginateParams, PaginatedResponse } from './type';
import { capitalize } from '#/helpers';

const DEFAULT_SIZE = 25;

export const paginatedResponseType = (entity: any) => {
  @ObjectType(`Paginated${capitalize(entity.name)}s`)
  class PaginatedResponse {
    @Field(() => [entity], { nullable: 'items' })
    data: Array<typeof entity>;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    size: number;

    @Field(() => Int)
    total: number;
  };
  return PaginatedResponse;
};

export const paginate = async <T>(
  params: PaginateParams<T>,
): Promise<PaginatedResponse<T>> => {
  if (!params.query) {
    const repo = getRepository<T>(params.type);
    params.query = repo.createQueryBuilder().select();
  }

  const size = params.size || DEFAULT_SIZE;
  const paginatedQuery = params.query
      .skip(size * params.page)
      .take(size);

  const [result, total] = await paginatedQuery.getManyAndCount();

  return {
    data: result,
    page: params.page,
    total,
    size,
  };
}

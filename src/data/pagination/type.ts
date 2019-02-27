import { SelectQueryBuilder } from "typeorm";

export type PaginateParams<T> = {
  type: string,
  page: number,
  size?: number,
  query?: SelectQueryBuilder<T>,
}

export type PaginatedResponse<T> = {
  data: T[],
  page: number,
  size: number,
  total: number,
}

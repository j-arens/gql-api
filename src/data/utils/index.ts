import { SelectQueryBuilder } from 'typeorm';

/**
 * Reduces inputs against a map of keys => query fn into a full query
 */

type InputToQueryMap<T> = {
  [key: string]: (qb: SelectQueryBuilder<T>, input: any) => SelectQueryBuilder<T>,
};

export const prepareQuery = <T>(input: object, queryMap: InputToQueryMap<T>) =>
    (queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T> =>
      Object.entries(input).reduce((qb, [k, v]) => {
        const blacklistedkeys = ['size', 'page']; // pagination keys
        if (blacklistedkeys.includes(k)) {
          return qb;
        }
        // @TODO: bind methods to queryBuilder?
        return queryMap[k].call(qb, qb, v);
      }, queryBuilder);

/**
 * Builds a query to search for a term within (or not in) a set 
 */

// silly overload because typescript can't infer arguments from a spread operation
export function searchSet<T, U>(...ignoreMe: any[]): SelectQueryBuilder<T>;
export function searchSet<T, U>(qb: SelectQueryBuilder<T>, search: U | U[], where: string, notIn?: boolean): SelectQueryBuilder<T>;
export function searchSet<T, U>(
  qb: SelectQueryBuilder<T>,
  search: U | U[],
  where: string,
  notIn: boolean = false,
): SelectQueryBuilder<T> {
  const query = (term: U) => `${notIn ? '!' : ''}FIND_IN_SET('${term}', ${where})`;
  if (Array.isArray(search)) {
    return search.reduce((q, term) => q.andWhere(query(term)), qb);
  }
  return qb.andWhere(query(search));
};
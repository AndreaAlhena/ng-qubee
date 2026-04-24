/**
 * Enum representing the available filter operators for explicit operator
 * filters
 *
 * NestJS encodes these with the `$` prefix at the wire level
 * (`filter.field=$operator:value`); PostgREST translates them to its own
 * prefix notation (`col=eq.val`, `col=is.null`, etc.). The enum values are
 * intentionally the NestJS form; each driver's request strategy is
 * responsible for mapping them into its own shape.
 *
 * `FTS`, `PLFTS`, `PHFTS`, `WFTS` are PostgREST-native full-text search
 * variants; they throw `UnsupportedFilterOperatorError` on every other
 * driver that does not recognise them.
 *
 * @see https://github.com/ppetzold/nestjs-paginate
 * @see https://postgrest.org/en/stable/api.html#operators
 */
export enum FilterOperatorEnum {
  BTW = '$btw',
  CONTAINS = '$contains',
  EQ = '$eq',
  FTS = '$fts',
  GT = '$gt',
  GTE = '$gte',
  ILIKE = '$ilike',
  IN = '$in',
  LT = '$lt',
  LTE = '$lte',
  NOT = '$not',
  NULL = '$null',
  PHFTS = '$phfts',
  PLFTS = '$plfts',
  SW = '$sw',
  WFTS = '$wfts'
}

/**
 * Enum representing the available filter operators for the NestJS driver
 *
 * These operators map to the nestjs-paginate filter syntax:
 * `filter.field=$operator:value`
 *
 * @see https://github.com/ppetzold/nestjs-paginate
 */
export enum FilterOperatorEnum {
  BTW = '$btw',
  CONTAINS = '$contains',
  EQ = '$eq',
  GT = '$gt',
  GTE = '$gte',
  ILIKE = '$ilike',
  IN = '$in',
  LT = '$lt',
  LTE = '$lte',
  NOT = '$not',
  NULL = '$null',
  SW = '$sw'
}

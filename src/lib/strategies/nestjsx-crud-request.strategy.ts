import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IOperatorFilter } from '../interfaces/operator-filter.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Request strategy for the @nestjsx/crud driver
 *
 * Generates URIs in [@nestjsx/crud's pipe-delimited query format](https://github.com/nestjsx/crud/wiki/Requests):
 * - Filters: `filter=field||$eq||value` (repeatable; multi-value
 *   collapses to `filter=field||$in||v1,v2`)
 * - Operator filters: `filter=field||$op||value` (translated from
 *   `FilterOperatorEnum` — `CONTAINS`→`$cont`, `ILIKE`→`$contL`,
 *   `SW`→`$starts`, `BTW`→`$between`, `NOT`→`$ne`/`$notin`,
 *   `NULL`→`$isnull`/`$notnull` with no value segment)
 * - Joins: `join=relation` (repeatable, from `addIncludes`)
 * - Field selection (flat): `fields=col1,col2` (from `addSelect`)
 * - Sorts: `sort=field,ASC` (repeatable, uppercase direction)
 * - Pagination (page-based): `page=N&limit=N`
 *
 * The JSON-shaped `s={...}` search parameter is intentionally out of
 * scope: it is not a plain search term, so `setSearch` throws
 * `UnsupportedSearchError` on this driver. PostgREST-native full-text
 * search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://github.com/nestjsx/crud/wiki/Requests
 */
export class NestjsxCrudRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, joins (`includes`), flat field selection
   * (`select`), sorts — no per-model fields, no global search (the `s`
   * parameter is JSON-shaped, not a plain term)
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: true,
    operatorFilters: true,
    search: false,
    select: true,
    sort: true
  };

  /**
   * @nestjsx/crud-native names of the four hardcoded query keys
   *
   * The wire format is fixed (the server's `CrudRequestInterceptor`
   * reads `fields`, `filter`, `join`, and `sort`); these keys are
   * intentionally not configurable through `QueryBuilderOptions` and
   * live as private statics so they are visible in one place.
   */
  private static readonly _fieldsKey = 'fields';
  private static readonly _filterKey = 'filter';
  private static readonly _joinKey = 'join';
  private static readonly _sortKey = 'sort';

  /**
   * Pipe delimiter separating field, operator, and value segments
   */
  private static readonly _separator = '||';

  /**
   * Emit @nestjsx/crud-format query-string segments in canonical order:
   * fields → filters → operator filters → join → sort → limit → page
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration (used
   * for `page` / `limit`, whose defaults match the wire format; the
   * `fields` / `filter` / `join` / `sort` keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFields(state, out);
    this._appendFilters(state, out);
    this._appendOperatorFilters(state, out);
    this._appendJoin(state, out);
    this._appendSort(state, out);
    this._appendLimit(state, options, out);
    this._appendPage(state, options, out);

    return out;
  }

  /**
   * Append `fields=col1,col2` from the flat select array
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFields(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(`${NestjsxCrudRequestStrategy._fieldsKey}=${state.select.join(',')}`);
  }

  /**
   * Append simple filters as repeatable `filter=field||$eq||value` params
   *
   * Single-value filters fold to `$eq`; multi-value filters fold to
   * `$in` with comma-joined values.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, out: string[]): void {
    const sep = NestjsxCrudRequestStrategy._separator;

    Object.keys(state.filters).forEach(field => {
      const values = state.filters[field];

      if (!values.length) {
        return;
      }

      const condition = values.length === 1
        ? `$eq${sep}${values[0]}`
        : `$in${sep}${values.join(',')}`;

      out.push(`${NestjsxCrudRequestStrategy._filterKey}=${field}${sep}${condition}`);
    });
  }

  /**
   * Append `join=relation` params from the includes array
   *
   * Per-relation field projection (`join=relation||f1,f2`) is not
   * expressible through the current state shape and is out of scope.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendJoin(state: IQueryBuilderState, out: string[]): void {
    state.includes.forEach(relation => {
      out.push(`${NestjsxCrudRequestStrategy._joinKey}=${relation}`);
    });
  }

  /**
   * Append the limit parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendLimit(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.limit}=${state.limit}`);
  }

  /**
   * Append operator filters as repeatable `filter=field||$op||value` params
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOperatorFilters(state: IQueryBuilderState, out: string[]): void {
    const sep = NestjsxCrudRequestStrategy._separator;

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      const condition = this._formatOperatorCondition(filter);

      out.push(`${NestjsxCrudRequestStrategy._filterKey}=${filter.field}${sep}${condition}`);
    });
  }

  /**
   * Append the page parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPage(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.page}=${state.page}`);
  }

  /**
   * Append `sort=field,ASC` params, one per sort rule
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, out: string[]): void {
    state.sorts.forEach(sort => {
      const direction = sort.order === SortEnum.DESC ? 'DESC' : 'ASC';

      out.push(`${NestjsxCrudRequestStrategy._sortKey}=${sort.field},${direction}`);
    });
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into @nestjsx/crud's
   * `$operator||value` condition segment
   *
   * The mapping is library-canonical → @nestjsx/crud-native:
   * - `EQ`/`GT`/`GTE`/`LT`/`LTE`/`IN` → identity (same operator name)
   * - `CONTAINS` → `$cont`; `ILIKE` → `$contL` (case-insensitive contains)
   * - `SW` → `$starts`
   * - `BTW` → `$between` with `min,max` (arity-checked)
   * - `NOT` → `$ne` (single value) / `$notin` (multi-value)
   * - `NULL` → `$isnull` (when value is `true`) / `$notnull` (when value
   *   is `false`); both emit **no value segment**; arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no @nestjsx/crud equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns The `$operator||value` (or bare `$operator`) condition segment
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorCondition(filter: IOperatorFilter): string {
    const sep = NestjsxCrudRequestStrategy._separator;
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return `$eq${sep}${first}`;
      case FilterOperatorEnum.GT: return `$gt${sep}${first}`;
      case FilterOperatorEnum.GTE: return `$gte${sep}${first}`;
      case FilterOperatorEnum.LT: return `$lt${sep}${first}`;
      case FilterOperatorEnum.LTE: return `$lte${sep}${first}`;
      case FilterOperatorEnum.CONTAINS: return `$cont${sep}${first}`;
      case FilterOperatorEnum.ILIKE: return `$contL${sep}${first}`;
      case FilterOperatorEnum.IN: return `$in${sep}${values.join(',')}`;
      case FilterOperatorEnum.SW: return `$starts${sep}${first}`;

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return `$between${sep}${values.join(',')}`;
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? `$ne${sep}${first}`
          : `$notin${sep}${values.join(',')}`;

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? '$isnull' : '$notnull';
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { PaginationModeEnum } from '../enums/pagination-mode.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IOperatorFilter } from '../interfaces/operator-filter.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Request strategy for the PostgREST driver
 *
 * PostgREST auto-generates REST APIs from PostgreSQL schemas and is the
 * backbone of Supabase's data API. This strategy produces URIs in
 * PostgREST's native query-string format:
 *
 * - Filters: `col=eq.val` (single value) / `col=in.(v1,v2,v3)` (multi-value)
 * - Order: `order=col1.asc,col2.desc`
 * - Select: `select=col1,col2`
 * - Pagination: `limit=N&offset=M` (offset derived from state.page)
 *
 * The `order` and `offset` query-parameter names are PostgREST conventions
 * and are intentionally not configurable via `QueryBuilderOptions` (see
 * issue #50 MVP scope). `limit`, `select`, and `filters` (per-column name)
 * honour the existing option keys.
 *
 * @see https://postgrest.org/en/stable/api.html
 * @see https://supabase.com/docs/reference/javascript/select
 */
export class PostgrestRequestStrategy implements IRequestStrategy {

  private static readonly _offsetKey = 'offset';
  private static readonly _orderKey = 'order';

  /**
   * Active pagination mode
   *
   * QUERY (default) → URL emits limit/offset.
   * RANGE → URL omits them; `buildPaginationHeaders()` returns the
   * `Range-Unit` / `Range` HTTP headers instead.
   */
  private readonly _paginationMode: PaginationModeEnum;

  /**
   * Accumulator for composing the URI string
   */
  private _uri = '';

  /**
   * @param paginationMode - Wire-level pagination mechanism. Defaults to
   * `PaginationModeEnum.QUERY`; `provideNgQubee` wires this from
   * `IConfig.pagination`.
   */
  constructor(paginationMode: PaginationModeEnum = PaginationModeEnum.QUERY) {
    this._paginationMode = paginationMode;
  }

  /**
   * Build a URI string from the given state using the PostgREST format
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if resource is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.resource) {
      throw new Error('Set the resource property BEFORE adding filters or calling the url() / get() methods');
    }

    this._uri = '';

    this._parseFilters(state, options);
    this._parseOperatorFilters(state);
    this._parseOrder(state);
    this._parseSelect(state, options);

    // In RANGE mode, pagination travels via HTTP headers — see buildPaginationHeaders
    if (this._paginationMode === PaginationModeEnum.QUERY) {
      this._parseLimit(state, options);
      this._parseOffset(state);
    }

    // In RANGE mode with no filters/sorts/select, nothing would have been
    // appended yet and the URI would come out empty. Emit the bare resource
    // path so the consumer still gets a valid target URL.
    if (!this._uri) {
      this._uri = state.baseUrl ? `${state.baseUrl}/${state.resource}` : `/${state.resource}`;
    }

    return this._uri;
  }

  /**
   * Compute `Range-Unit` / `Range` HTTP headers for RANGE pagination mode
   *
   * In QUERY mode this returns `null` so `NgQubeeService.paginationHeaders()`
   * conveys "no headers needed" to the consumer. In RANGE mode the method
   * converts the 1-indexed `state.page` + `state.limit` into PostgREST's
   * 0-indexed inclusive range (`from = (page - 1) * limit`,
   * `to = from + limit - 1`) and returns both header values.
   *
   * @param state - The current query builder state
   * @returns `{ 'Range-Unit': 'items', 'Range': 'from-to' }` or `null`
   */
  public buildPaginationHeaders(state: IQueryBuilderState): Record<string, string> | null {
    if (this._paginationMode !== PaginationModeEnum.RANGE) {
      return null;
    }

    const from = (state.page - 1) * state.limit;
    const to = from + state.limit - 1;

    /* eslint-disable @typescript-eslint/naming-convention */
    return {
      'Range-Unit': 'items',
      'Range': `${from}-${to}`
    };
    /* eslint-enable @typescript-eslint/naming-convention */
  }

  /**
   * Validate that the given limit is accepted by the PostgREST driver
   *
   * PostgREST does not recognise `-1` as a "fetch all" sentinel (unbounded
   * result sets are requested by omitting `limit` entirely, which is not
   * a shape ng-qubee emits), so only positive integers are accepted.
   *
   * @param limit - The limit value to validate
   * @throws {InvalidLimitError} If the value is not a positive integer
   */
  public validateLimit(limit: number): void {
    if (Number.isInteger(limit) && limit >= 1) {
      return;
    }

    throw new InvalidLimitError(limit);
  }

  /**
   * Parse and append filter parameters in PostgREST format
   *
   * Every filter is operator-prefixed (PostgREST has no implicit equality):
   * a single value yields `col=eq.val`; multiple values collapse into
   * PostgREST's native IN-list syntax `col=in.(v1,v2,v3)`.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseFilters(state: IQueryBuilderState, _options: QueryBuilderOptions): void {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return;
    }

    keys.forEach(key => {
      const values = state.filters[key];

      if (!values.length) {
        return;
      }

      // single-value → eq.<val>
      // multi-value → in.(v1,v2,v3)
      const rhs = values.length === 1
        ? `eq.${values[0]}`
        : `in.(${values.join(',')})`;

      this._uri += `${this._prepend(state)}${key}=${rhs}`;
    });
  }

  /**
   * Parse and append the limit parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseLimit(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    this._uri += `${this._prepend(state)}${options.limit}=${state.limit}`;
  }

  /**
   * Parse and append the offset parameter, derived from state.page
   *
   * PostgREST uses offset-based pagination, not page-based. The offset is
   * computed as `(page - 1) * limit`. Omitted when offset would be 0
   * (i.e. page 1) since PostgREST defaults to offset=0 anyway and dropping
   * it keeps the URI shorter.
   *
   * @param state - The current query builder state
   */
  private _parseOffset(state: IQueryBuilderState): void {
    const offset = (state.page - 1) * state.limit;

    if (offset <= 0) {
      return;
    }

    this._uri += `&${PostgrestRequestStrategy._offsetKey}=${offset}`;
  }

  /**
   * Parse and append explicit operator filters
   *
   * Maps each `FilterOperatorEnum` value to PostgREST's prefix-operator
   * syntax. `BTW` expands to two query params (`gte` + `lte`); `NULL`
   * emits `is.null` / `is.not.null` based on the boolean value; `NOT`
   * picks its inner operator by arity (`not.eq.val` for single values,
   * `not.in.(v1,v2)` for multi-value).
   *
   * @param state - The current query builder state
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive exactly 2 values, or `NULL` does not receive exactly 1 boolean
   */
  private _parseOperatorFilters(state: IQueryBuilderState): void {
    if (!state.operatorFilters.length) {
      return;
    }

    state.operatorFilters.forEach(filter => {
      // BTW is special: expands to two separate query params
      if (filter.operator === FilterOperatorEnum.BTW) {
        this._emitBetweenFilter(filter);
        return;
      }

      const rhs = this._formatOperatorRhs(filter);
      this._uri += `${this._prepend(state)}${filter.field}=${rhs}`;
    });
  }

  /**
   * Emit a `BTW` operator filter as two PostgREST params
   *
   * Produces: `col=gte.min&col=lte.max`. Values must be exactly `[min, max]`.
   *
   * @param filter - The operator filter carrying the BTW bounds
   * @throws {InvalidFilterOperatorValueError} If values.length !== 2
   */
  private _emitBetweenFilter(filter: IOperatorFilter): void {
    if (filter.values.length !== 2) {
      throw new InvalidFilterOperatorValueError(
        filter.operator,
        'BTW requires exactly 2 values (min, max)'
      );
    }

    const [min, max] = filter.values;

    // Both params use _prepend so the `?` vs `&` glue stays consistent
    this._uri += `${this._prepend({} as IQueryBuilderState)}${filter.field}=gte.${min}`;
    this._uri += `&${filter.field}=lte.${max}`;
  }

  /**
   * Build the right-hand-side of a PostgREST filter param for the given operator
   *
   * Kept as a separate helper so each operator's shape is visible in one
   * place and the dispatch is exhaustively typed against
   * `FilterOperatorEnum`.
   *
   * @param filter - The operator filter (field, operator, values)
   * @returns The PostgREST-formatted value portion (right of the `=` sign)
   * @throws {InvalidFilterOperatorValueError} If NULL receives a non-boolean or wrong arity
   */
  private _formatOperatorRhs(filter: IOperatorFilter): string {
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return `eq.${first}`;
      case FilterOperatorEnum.GT: return `gt.${first}`;
      case FilterOperatorEnum.GTE: return `gte.${first}`;
      case FilterOperatorEnum.LT: return `lt.${first}`;
      case FilterOperatorEnum.LTE: return `lte.${first}`;
      case FilterOperatorEnum.ILIKE: return `ilike.${first}`;
      case FilterOperatorEnum.IN: return `in.(${values.join(',')})`;
      case FilterOperatorEnum.SW: return `like.${first}*`;
      case FilterOperatorEnum.CONTAINS: return `ilike.%${first}%`;
      case FilterOperatorEnum.FTS: return `fts.${first}`;
      case FilterOperatorEnum.PLFTS: return `plfts.${first}`;
      case FilterOperatorEnum.PHFTS: return `phfts.${first}`;
      case FilterOperatorEnum.WFTS: return `wfts.${first}`;

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? `not.eq.${first}`
          : `not.in.(${values.join(',')})`;

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? 'is.null' : 'is.not.null';
      }

      // BTW is handled by _emitBetweenFilter; falling through would be a bug
      case FilterOperatorEnum.BTW:
        throw new InvalidFilterOperatorValueError(
          operator,
          'BTW should be dispatched to _emitBetweenFilter — this indicates a bug'
        );
    }
  }

  /**
   * Parse and append the order parameter
   *
   * Generates: `order=col1.asc,col2.desc`
   *
   * @param state - The current query builder state
   */
  private _parseOrder(state: IQueryBuilderState): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.field}.${sort.order === SortEnum.DESC ? 'desc' : 'asc'}`
    );

    this._uri += `${this._prepend(state)}${PostgrestRequestStrategy._orderKey}=${pairs.join(',')}`;
  }

  /**
   * Parse and append the select parameter (flat column list)
   *
   * Generates: `select=col1,col2`. PostgREST uses a `select` query param
   * for column pruning, matching NestJS semantics.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseSelect(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    if (!state.select.length) {
      return;
    }

    this._uri += `${this._prepend(state)}${options.select}=${state.select.join(',')}`;
  }

  /**
   * Determine the appropriate URI prefix based on the current accumulator state
   *
   * Returns the full base path with `?` for the first parameter,
   * or `&` for subsequent parameters.
   *
   * @param state - The current query builder state
   * @returns The prefix string to prepend to the next parameter
   */
  private _prepend(state: IQueryBuilderState): string {
    if (this._uri) {
      return '&';
    }

    return state.baseUrl ? `${state.baseUrl}/${state.resource}?` : `/${state.resource}?`;
  }
}

import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
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
   * Accumulator for composing the URI string
   */
  private _uri = '';

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
    this._parseOrder(state);
    this._parseSelect(state, options);
    this._parseLimit(state, options);
    this._parseOffset(state);

    return this._uri;
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

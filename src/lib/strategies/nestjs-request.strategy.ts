import { SortEnum } from '../enums/sort.enum';
import { IOperatorFilter } from '../interfaces/operator-filter.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Request strategy for the NestJS (nestjs-paginate) driver
 *
 * Generates URIs in the NestJS paginate format:
 * - Simple filters: `filter.field=value`
 * - Operator filters: `filter.field=$operator:value`
 * - Sorts: `sortBy=field1:DESC,field2:ASC`
 * - Select: `select=col1,col2`
 * - Search: `search=term`
 * - Pagination: `limit=N&page=N`
 *
 * @see https://github.com/ppetzold/nestjs-paginate
 */
export class NestjsRequestStrategy implements IRequestStrategy {

  /**
   * Accumulator for composing the URI string
   */
  private _uri = '';

  /**
   * Build a URI string from the given state using the NestJS paginate format
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if model is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.resource) {
      throw new Error('Set the resource property BEFORE adding filters or calling the url() / get() methods');
    }

    this._uri = '';

    this._parseFilters(state, options);
    this._parseOperatorFilters(state, options);
    this._parseSort(state, options);
    this._parseSelect(state, options);
    this._parseSearch(state, options);
    this._parseLimit(state, options);
    this._parsePage(state, options);

    return this._uri;
  }

  /**
   * Parse and append simple filter parameters
   *
   * Generates: `filter.field=value1,value2` for each filter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseFilters(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return;
    }

    keys.forEach(key => {
      const values = state.filters[key].join(',');
      const param = `${this._prepend(state)}${options.filters}.${key}=${values}`;
      this._uri += param;
    });
  }

  /**
   * Parse and append the limit parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseLimit(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    const param = `${this._prepend(state)}${options.limit}=${state.limit}`;
    this._uri += param;
  }

  /**
   * Parse and append operator filter parameters
   *
   * Groups operator filters by field and generates:
   * - Single value: `filter.field=$operator:value`
   * - Multiple values ($in, $btw): `filter.field=$operator:val1,val2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseOperatorFilters(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    if (!state.operatorFilters.length) {
      return;
    }

    state.operatorFilters.forEach((opFilter: IOperatorFilter) => {
      const values = opFilter.values.join(',');
      const param = `${this._prepend(state)}${options.filters}.${opFilter.field}=${opFilter.operator}:${values}`;
      this._uri += param;
    });
  }

  /**
   * Parse and append the page parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parsePage(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    const param = `${this._prepend(state)}${options.page}=${state.page}`;
    this._uri += param;
  }

  /**
   * Parse and append the search parameter
   *
   * Generates: `search=term`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseSearch(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    if (!state.search) {
      return;
    }

    const param = `${this._prepend(state)}${options.search}=${state.search}`;
    this._uri += param;
  }

  /**
   * Parse and append the select parameter
   *
   * Generates: `select=col1,col2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseSelect(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    if (!state.select.length) {
      return;
    }

    const param = `${this._prepend(state)}${options.select}=${state.select.join(',')}`;
    this._uri += param;
  }

  /**
   * Parse and append sort parameters
   *
   * Generates: `sortBy=field1:DESC,field2:ASC`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   */
  private _parseSort(state: IQueryBuilderState, options: QueryBuilderOptions): void {
    if (!state.sorts.length) {
      return;
    }

    const sortPairs = state.sorts.map(sort =>
      `${sort.field}:${sort.order === SortEnum.DESC ? 'DESC' : 'ASC'}`
    );

    const param = `${this._prepend(state)}${options.sortBy}=${sortPairs.join(',')}`;
    this._uri += param;
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

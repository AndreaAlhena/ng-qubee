import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IOperatorFilter } from '../interfaces/operator-filter.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

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
export class NestjsRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, flat select, global search — no
   * per-model fields, no includes
   */
  public readonly capabilities: IStrategyCapabilities = {
    fields: false,
    filters: true,
    includes: false,
    operatorFilters: true,
    search: true,
    select: true,
    sort: true
  };

  /**
   * Validate that the given limit is accepted by nestjs-paginate
   *
   * Accepts any integer `>= 1` as a page size, plus `-1` which nestjs-paginate
   * interprets as "fetch all items" (server must opt-in via `maxLimit: -1`).
   *
   * @param limit - The limit value to validate
   * @throws {InvalidLimitError} If the value is not an integer, or is 0, or is a negative number other than -1
   */
  public override validateLimit(limit: number): void {
    if (Number.isInteger(limit) && (limit === -1 || limit >= 1)) {
      return;
    }

    throw new InvalidLimitError(limit, true);
  }

  /**
   * Emit NestJS-format query-string segments in canonical order:
   * filters → operator filters → sortBy → select → search → limit → page
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, options, out);
    this._appendOperatorFilters(state, options, out);
    this._appendSort(state, options, out);
    this._appendSelect(state, options, out);
    this._appendSearch(state, options, out);
    this._appendLimit(state, options, out);
    this._appendPage(state, options, out);

    return out;
  }

  /**
   * Append simple filter parameters as `filter.field=value1,value2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return;
    }

    keys.forEach(key => {
      const values = state.filters[key].join(',');
      out.push(`${options.filters}.${key}=${values}`);
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
   * Append operator-filter parameters as `filter.field=$op:value`
   *
   * Groups by field; multi-value operators ($in, $btw) join values with commas.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOperatorFilters(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.operatorFilters.length) {
      return;
    }

    state.operatorFilters.forEach((opFilter: IOperatorFilter) => {
      const values = opFilter.values.join(',');
      out.push(`${options.filters}.${opFilter.field}=${opFilter.operator}:${values}`);
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
   * Append the search parameter as `search=term`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSearch(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.search) {
      return;
    }

    out.push(`${options.search}=${state.search}`);
  }

  /**
   * Append the select parameter as `select=col1,col2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSelect(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(`${options.select}=${state.select.join(',')}`);
  }

  /**
   * Append sort parameter as `sortBy=field1:DESC,field2:ASC`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.field}:${sort.order === SortEnum.DESC ? 'DESC' : 'ASC'}`
    );

    out.push(`${options.sortBy}=${pairs.join(',')}`);
  }
}

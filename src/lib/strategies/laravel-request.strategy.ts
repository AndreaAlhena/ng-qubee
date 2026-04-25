import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Request strategy for the Laravel (pagination-only) driver
 *
 * Generates simple pagination URIs:
 * - `/{resource}?limit=N&page=N`
 *
 * Filters, sorts, fields, includes, search, and select in state are ignored.
 */
export class LaravelRequestStrategy extends AbstractRequestStrategy {

  /**
   * Pagination-only driver — no filtering, sorting, or column selection
   */
  public readonly capabilities: IStrategyCapabilities = {
    fields: false,
    filters: false,
    includes: false,
    operatorFilters: false,
    search: false,
    select: false,
    sort: false
  };

  /**
   * Emit only the pagination params; filters/sorts/etc. are ignored
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The two pagination query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    return [
      `${options.limit}=${state.limit}`,
      `${options.page}=${state.page}`
    ];
  }
}

import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Request strategy for the Laravel (pagination-only) driver
 *
 * Generates simple pagination URIs:
 * - `/{resource}?limit=N&page=N`
 *
 * Filters, sorts, fields, includes, search, and select in state are ignored.
 */
export class LaravelRequestStrategy implements IRequestStrategy {

  /**
   * Build a pagination-only URI from the given state
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if resource is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.resource) {
      throw new Error('Set the resource property BEFORE calling the url() / get() methods');
    }

    const base = state.baseUrl ? `${state.baseUrl}/${state.resource}` : `/${state.resource}`;

    return `${base}?${options.limit}=${state.limit}&${options.page}=${state.page}`;
  }
}

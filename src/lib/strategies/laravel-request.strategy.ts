import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
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

  /**
   * Validate that the given limit is accepted by the Laravel driver
   *
   * Laravel pagination does not recognize `-1` as a "fetch all" sentinel,
   * so only positive integers are accepted.
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
}

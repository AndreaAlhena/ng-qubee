import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Base class for response strategies whose pagination metadata is a flat
 * key-value envelope on the response body
 *
 * Laravel's stock pagination and Spatie's `QueryBuilder` both emit the
 * same flat shape — `{ data, current_page, total, per_page, from, to,
 * next_page_url, prev_page_url, first_page_url, last_page, last_page_url
 * }` — and both response strategies were duplicating the byte-identical
 * `new PaginatedCollection(response[options.X], ...)` body before this
 * base existed. Concrete classes now extend and provide only the
 * docstring describing their driver's specific shape (see
 * `LaravelResponseStrategy`, `SpatieResponseStrategy`).
 *
 * Drivers whose pagination metadata is a nested envelope (JSON:API,
 * NestJS, Strapi) extend `AbstractDotPathResponseStrategy` instead.
 * Drivers whose metadata comes from HTTP headers (PostgREST) or is
 * derived from response URLs (DRF) implement `IResponseStrategy`
 * directly.
 */
export abstract class AbstractFlatResponseStrategy implements IResponseStrategy {

  /**
   * Parse a flat-envelope pagination response into a PaginatedCollection
   *
   * @param response - The raw API response object
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    return new PaginatedCollection(
      response[options.data],
      response[options.currentPage],
      response[options.from],
      response[options.to],
      response[options.total],
      response[options.perPage],
      response[options.prevPageUrl],
      response[options.nextPageUrl],
      response[options.lastPage],
      response[options.firstPageUrl],
      response[options.lastPageUrl]
    );
  }
}

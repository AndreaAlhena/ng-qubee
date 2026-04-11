import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the Laravel (Spatie Query Builder) driver
 *
 * Parses flat Laravel pagination responses:
 * ```json
 * {
 *   "data": [...],
 *   "current_page": 1,
 *   "total": 100,
 *   "per_page": 15,
 *   "from": 1,
 *   "to": 15,
 *   ...
 * }
 * ```
 */
export class LaravelResponseStrategy implements IResponseStrategy {

  /**
   * Parse a flat Laravel pagination response into a PaginatedCollection
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

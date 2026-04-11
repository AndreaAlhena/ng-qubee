import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the NestJS (nestjs-paginate) driver
 *
 * Parses nested NestJS pagination responses:
 * ```json
 * {
 *   "data": [...],
 *   "meta": {
 *     "currentPage": 1,
 *     "totalItems": 100,
 *     "itemsPerPage": 10,
 *     "totalPages": 10
 *   },
 *   "links": {
 *     "first": "url",
 *     "previous": "url",
 *     "next": "url",
 *     "last": "url",
 *     "current": "url"
 *   }
 * }
 * ```
 *
 * @see https://github.com/ppetzold/nestjs-paginate
 */
export class NestjsResponseStrategy implements IResponseStrategy {

  /**
   * Parse a nested NestJS pagination response into a PaginatedCollection
   *
   * Supports dot-notation key paths for accessing nested values.
   * Computes `from` and `to` from `currentPage` and `itemsPerPage` when
   * they are not directly available in the response.
   *
   * @param response - The raw API response object
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = this._resolve(response, options.data) as T[];
    const currentPage = this._resolve(response, options.currentPage) as number;
    const total = this._resolve(response, options.total) as number | undefined;
    const perPage = this._resolve(response, options.perPage) as number | undefined;
    const lastPage = this._resolve(response, options.lastPage) as number | undefined;

    // Compute from/to if not directly available
    const from = this._resolveFrom(response, options, currentPage, perPage);
    const to = this._resolveTo(response, options, currentPage, perPage, total);

    const prevPageUrl = this._resolve(response, options.prevPageUrl) as string | undefined;
    const nextPageUrl = this._resolve(response, options.nextPageUrl) as string | undefined;
    const firstPageUrl = this._resolve(response, options.firstPageUrl) as string | undefined;
    const lastPageUrl = this._resolve(response, options.lastPageUrl) as string | undefined;

    return new PaginatedCollection(
      data,
      currentPage,
      from,
      to,
      total,
      perPage,
      prevPageUrl,
      nextPageUrl,
      lastPage,
      firstPageUrl,
      lastPageUrl
    );
  }

  /**
   * Resolve a value from a response object using a dot-notation path
   *
   * Supports both flat keys ('data') and nested paths ('meta.currentPage').
   *
   * @param response - The raw response object
   * @param path - The dot-notation path to resolve
   * @returns The resolved value, or undefined if not found
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolve(response: Record<string, any>, path: string): unknown {
    return path.split('.').reduce((obj, key) => obj?.[key], response);
  }

  /**
   * Resolve the "from" index value
   *
   * If the path resolves to a value in the response, use it.
   * Otherwise, compute it from currentPage and perPage:
   * `(currentPage - 1) * perPage + 1`
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @param currentPage - The current page number
   * @param perPage - The number of items per page
   * @returns The computed "from" index
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolveFrom(response: Record<string, any>, options: ResponseOptions, currentPage: number, perPage?: number): number | undefined {
    const direct = this._resolve(response, options.from);

    if (direct !== undefined) {
      return direct as number;
    }

    if (currentPage && perPage) {
      return (currentPage - 1) * perPage + 1;
    }

    return undefined;
  }

  /**
   * Resolve the "to" index value
   *
   * If the path resolves to a value in the response, use it.
   * Otherwise, compute it from currentPage, perPage, and total:
   * `Math.min(currentPage * perPage, total)`
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @param currentPage - The current page number
   * @param perPage - The number of items per page
   * @param total - The total number of items
   * @returns The computed "to" index
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolveTo(response: Record<string, any>, options: ResponseOptions, currentPage: number, perPage?: number, total?: number): number | undefined {
    const direct = this._resolve(response, options.to);

    if (direct !== undefined) {
      return direct as number;
    }

    if (currentPage && perPage && total) {
      return Math.min(currentPage * perPage, total);
    }

    return undefined;
  }
}

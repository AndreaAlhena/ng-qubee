import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';
import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the Spring Data REST driver
 *
 * Parses Spring Data REST's HAL envelope:
 * ```json
 * {
 *   "_embedded": { "users": [{ "id": 1, "name": "John" }] },
 *   "_links": {
 *     "first": { "href": "..." },
 *     "prev": { "href": "..." },
 *     "next": { "href": "..." },
 *     "last": { "href": "..." }
 *   },
 *   "page": { "size": 20, "totalElements": 100, "totalPages": 5, "number": 1 }
 * }
 * ```
 *
 * Two HAL quirks are absorbed here on top of the inherited dot-path
 * traversal:
 *
 * - **`page.number` is 0-indexed** — the strategy adds 1 so the library
 *   state stays 1-indexed (mirroring `SpringRequestStrategy`, which
 *   subtracts 1 on the way out).
 * - **The collection key under `_embedded` is the resource rel name**
 *   (e.g. `_embedded.users`), which cannot be known statically. The
 *   default `data` path is plain `_embedded`; when it resolves to an
 *   object rather than an array, the strategy picks the first array
 *   value inside it. Consumers with multiple embedded rels can pin the
 *   exact path via `IConfig.response` (e.g. `data: '_embedded.users'`).
 *
 * Default key paths are configured in `SpringResponseOptions`.
 *
 * @see https://docs.spring.io/spring-data/rest/reference/paging-and-sorting.html
 */
export class SpringResponseStrategy extends AbstractDotPathResponseStrategy {

  /**
   * Parse a Spring Data REST HAL response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public override paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = this._resolveData<T>(response, options);
    const currentPage = this._resolveCurrentPage(response, options);
    const total = this.resolve(response, options.total) as number | undefined;
    const perPage = this.resolve(response, options.perPage) as number | undefined;
    const lastPage = this.resolve(response, options.lastPage) as number | undefined;

    const from = this.resolveFrom(response, options, currentPage, perPage);
    const to = this.resolveTo(response, options, currentPage, perPage, total);

    const prevPageUrl = this.resolve(response, options.prevPageUrl) as string | undefined;
    const nextPageUrl = this.resolve(response, options.nextPageUrl) as string | undefined;
    const firstPageUrl = this.resolve(response, options.firstPageUrl) as string | undefined;
    const lastPageUrl = this.resolve(response, options.lastPageUrl) as string | undefined;

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
   * Resolve the 1-indexed current page from the 0-indexed `page.number`
   *
   * Falls back to page 1 when the path is missing entirely (defensive —
   * Spring always emits the `page` block on paged endpoints).
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @returns The 1-indexed current page number
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolveCurrentPage(response: Record<string, any>, options: ResponseOptions): number {
    const pageNumber = this.resolve(response, options.currentPage) as number | undefined;

    return (pageNumber ?? 0) + 1;
  }

  /**
   * Resolve the data array from the HAL `_embedded` wrapper
   *
   * When the configured path resolves directly to an array (a consumer
   * pinned `data: '_embedded.users'`), it is used as-is. When it
   * resolves to an object (the default `_embedded` path), the first
   * array value inside it is used — Spring emits exactly one collection
   * rel per listing endpoint. An empty array is returned when nothing
   * matches (e.g. Spring omits `_embedded` on empty result sets).
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @returns The resolved data array (possibly empty)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolveData<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): T[] {
    const raw = this.resolve(response, options.data);

    if (Array.isArray(raw)) {
      return raw as T[];
    }

    if (raw && typeof raw === 'object') {
      const firstArray = Object.values(raw).find(value => Array.isArray(value));

      if (firstArray) {
        return firstArray as T[];
      }
    }

    return [];
  }
}

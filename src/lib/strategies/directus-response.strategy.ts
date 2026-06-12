import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';
import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the Directus driver
 *
 * Parses Directus collection responses (with `meta=total_count,filter_count`
 * requested, which the request strategy always does):
 *
 * ```json
 * {
 *   "data": [{ "id": 1, "title": "Hello" }],
 *   "meta": { "total_count": 48, "filter_count": 12 }
 * }
 * ```
 *
 * The default `total` path is `meta.filter_count` — the number of items
 * matching the current filter, which is the relevant total for paging a
 * filtered collection (`meta.total_count` ignores filters; point the
 * `total` path at it via `IPaginationConfig` if that is what you want).
 *
 * The envelope carries **no current-page or page-size field**, so:
 *
 * - `currentPage` falls back to **1** unless a `currentPage` path is
 *   configured and resolves (only guaranteed correct for single-page
 *   results — track the requested page in your own state for multi-page
 *   UIs).
 * - `perPage` resolves only when a `perPage` path is configured.
 * - `lastPage` is `ceil(total ÷ perPage)` when both are known; on a
 *   response that provably holds the whole filtered set it resolves
 *   to 1.
 *
 * Every key path is overridable via `IPaginationConfig` (dot notation
 * supported), so custom wrappers that do include paging fields map
 * without subclassing.
 *
 * @see https://docs.directus.io/reference/query.html#meta
 */
export class DirectusResponseStrategy extends AbstractDotPathResponseStrategy {

  /**
   * Parse a Directus collection response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration (dot-notation paths supported)
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public override paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = this.resolve(response, options.data) as T[];
    const total = this.resolve(response, options.total) as number | undefined;
    const currentPage = (this.resolve(response, options.currentPage) as number | undefined) ?? 1;
    const perPage = this.resolve(response, options.perPage) as number | undefined;
    const lastPage = this._deriveLastPage(response, options, data, total, perPage);

    const from = this.resolveFrom(response, options, currentPage, perPage) ?? this._singlePageFrom(data, total);
    const to = this.resolveTo(response, options, currentPage, perPage, total) ?? this._singlePageTo(data, total);

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
   * Derive the last page number
   *
   * Resolution order: the configured `lastPage` path, then
   * `ceil(total ÷ perPage)` when both are known, then 1 when the
   * response provably holds the entire non-empty filtered set.
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @param data - The items on the current page
   * @param total - The total item count
   * @param perPage - The page size
   * @returns The last page number, or undefined when inputs insufficient
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _deriveLastPage(response: Record<string, any>, options: ResponseOptions, data: unknown[] | undefined, total?: number, perPage?: number): number | undefined {
    const direct = this.resolve(response, options.lastPage) as number | undefined;

    if (direct !== undefined) {
      return direct;
    }

    if (total !== undefined && perPage !== undefined && perPage > 0) {
      return Math.ceil(total / perPage);
    }

    if (total !== undefined && total > 0 && (data?.length ?? 0) >= total) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive `from` for a response that holds the whole filtered set
   *
   * @param data - The items on the current page
   * @param total - The total item count
   * @returns 1 when the page provably holds all items, undefined otherwise
   */
  private _singlePageFrom(data: unknown[] | undefined, total?: number): number | undefined {
    if (total !== undefined && data?.length && data.length >= total) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive `to` for a response that holds the whole filtered set
   *
   * @param data - The items on the current page
   * @param total - The total item count
   * @returns The item count when the page provably holds all items, undefined otherwise
   */
  private _singlePageTo(data: unknown[] | undefined, total?: number): number | undefined {
    if (total !== undefined && data?.length && data.length >= total) {
      return data.length;
    }

    return undefined;
  }
}

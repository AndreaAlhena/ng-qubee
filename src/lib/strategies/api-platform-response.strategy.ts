import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';
import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the API Platform (Symfony) driver
 *
 * Parses API Platform's default Hydra/JSON-LD collection envelope:
 *
 * ```json
 * {
 *   "@context": "/contexts/Book",
 *   "@type": "hydra:Collection",
 *   "hydra:totalItems": 48,
 *   "hydra:member": [...],
 *   "hydra:view": {
 *     "@id": "/books?page=3&itemsPerPage=10",
 *     "hydra:first": "/books?page=1",
 *     "hydra:previous": "/books?page=2",
 *     "hydra:next": "/books?page=4",
 *     "hydra:last": "/books?page=5"
 *   }
 * }
 * ```
 *
 * The Hydra keys contain colons but no dots, so the inherited
 * dot-notation resolver traverses them cleanly (`hydra:view.hydra:next`
 * → `response['hydra:view']['hydra:next']`). The body names no
 * current-page or page-size field, so both are **derived from the
 * `hydra:view` URLs**:
 *
 * - `currentPage` from the `page` param of the view's `@id` (the
 *   `path` option slot points there); missing view → page **1**.
 * - `perPage` from the `itemsPerPage` param of the view's `@id`
 *   (echoed whenever the request set it — this driver's request
 *   strategy always does), falling back to the item count of a page
 *   that has a `hydra:next` successor.
 * - `lastPage` from the `page` param of `hydra:last`, falling back to
 *   `ceil(total ÷ perPage)`; a view-less response holding the whole
 *   collection resolves to 1.
 *
 * URLs are typically **relative** (`/books?page=4`) — parsing retries
 * against a placeholder base, and the links are surfaced as-is on the
 * collection. JSON:API and HAL serialization formats are out of scope
 * (use the JSON:API driver for the former).
 *
 * @see https://api-platform.com/docs/core/pagination/
 */
export class ApiPlatformResponseStrategy extends AbstractDotPathResponseStrategy {

  /**
   * Parse a Hydra collection response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration (dot-notation paths supported)
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public override paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = this.resolve(response, options.data) as T[];
    const total = this.resolve(response, options.total) as number | undefined;
    const viewUrl = (this.resolve(response, options.path) ?? null) as string | null;

    const firstPageUrl = this.resolve(response, options.firstPageUrl) as string | undefined;
    const lastPageUrl = this.resolve(response, options.lastPageUrl) as string | undefined;
    const nextPageUrl = this.resolve(response, options.nextPageUrl) as string | undefined;
    const prevPageUrl = this.resolve(response, options.prevPageUrl) as string | undefined;

    const currentPage = this._deriveCurrentPage(viewUrl);
    const perPage = this._derivePerPage(viewUrl, nextPageUrl, data);
    const lastPage = this._deriveLastPage(lastPageUrl, viewUrl, data, total, perPage);

    const from = this.resolveFrom(response, options, currentPage, perPage) ?? this._wholeSetFrom(viewUrl, data, total);
    const to = this.resolveTo(response, options, currentPage, perPage, total) ?? this._wholeSetTo(viewUrl, data, total);

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
   * Derive the current page number from the `hydra:view` `@id` URL
   *
   * Reads the `page` query param; a missing view (pagination disabled
   * or a single-page collection without a partial view) or a link
   * without the param resolves to page 1.
   *
   * @param viewUrl - The `hydra:view.@id` URL, or null
   * @returns The current page number
   */
  private _deriveCurrentPage(viewUrl: string | null): number {
    if (viewUrl === null) {
      return 1;
    }

    return this._extractNumberParam(viewUrl, 'page') ?? 1;
  }

  /**
   * Derive the last page number
   *
   * Resolution order: the `page` param of `hydra:last`, then
   * `ceil(total ÷ perPage)`, then 1 for a view-less response that
   * provably holds the entire non-empty collection.
   *
   * @param lastPageUrl - The `hydra:view.hydra:last` URL (may be undefined)
   * @param viewUrl - The `hydra:view.@id` URL, or null
   * @param data - The items on the current page
   * @param total - The total item count
   * @param perPage - The page size
   * @returns The last page number, or undefined when inputs insufficient
   */
  private _deriveLastPage(lastPageUrl: string | undefined, viewUrl: string | null, data: unknown[] | undefined, total?: number, perPage?: number): number | undefined {
    if (lastPageUrl !== undefined) {
      const direct = this._extractNumberParam(lastPageUrl, 'page');

      if (direct !== undefined) {
        return direct;
      }
    }

    if (total !== undefined && perPage !== undefined && perPage > 0) {
      return Math.ceil(total / perPage);
    }

    if (viewUrl === null && total !== undefined && total > 0 && (data?.length ?? 0) >= total) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive `perPage` from the `hydra:view` `@id` URL
   *
   * Reads the `itemsPerPage` query param (echoed whenever the request
   * set it). When absent, a page with a `hydra:next` successor is
   * necessarily full, so its item count equals the page size.
   *
   * @param viewUrl - The `hydra:view.@id` URL, or null
   * @param nextPageUrl - The `hydra:view.hydra:next` URL (may be undefined)
   * @param data - The items on the current page
   * @returns The page size, or undefined
   */
  private _derivePerPage(viewUrl: string | null, nextPageUrl: string | undefined, data: unknown[] | undefined): number | undefined {
    if (viewUrl !== null) {
      const direct = this._extractNumberParam(viewUrl, 'itemsPerPage');

      if (direct !== undefined) {
        return direct;
      }
    }

    if (nextPageUrl !== undefined) {
      return data?.length || undefined;
    }

    return undefined;
  }

  /**
   * Extract an integer query parameter from a Hydra URL
   *
   * @param url - The URL to parse
   * @param name - The query-parameter name to look up (e.g. `page`)
   * @returns The integer value, or undefined
   */
  private _extractNumberParam(url: string, name: string): number | undefined {
    const raw = this._extractQueryParam(url, name);

    if (raw === undefined) {
      return undefined;
    }

    const parsed = Number.parseInt(raw, 10);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Extract a single query parameter from a URL via the WHATWG URL parser
   *
   * Hydra links are typically **relative** (`/books?page=4`), so parsing
   * retries against a placeholder base before giving up. Returns
   * undefined when the URL is unparseable or the parameter is absent.
   *
   * @param url - The URL to parse
   * @param name - The query-parameter name to look up
   * @returns The raw string value of the parameter, or undefined
   */
  private _extractQueryParam(url: string, name: string): string | undefined {
    try {
      const parsed = new URL(url, 'http://relative.invalid');
      const value = parsed.searchParams.get(name);

      return value === null ? undefined : value;
    } catch {
      return undefined;
    }
  }

  /**
   * Derive `from` for a view-less response holding the whole collection
   *
   * @param viewUrl - The `hydra:view.@id` URL, or null
   * @param data - The items on the current page
   * @param total - The total item count
   * @returns 1 when the response provably holds all items, undefined otherwise
   */
  private _wholeSetFrom(viewUrl: string | null, data: unknown[] | undefined, total?: number): number | undefined {
    if (viewUrl === null && total !== undefined && data?.length && data.length >= total) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive `to` for a view-less response holding the whole collection
   *
   * @param viewUrl - The `hydra:view.@id` URL, or null
   * @param data - The items on the current page
   * @param total - The total item count
   * @returns The item count when the response provably holds all items, undefined otherwise
   */
  private _wholeSetTo(viewUrl: string | null, data: unknown[] | undefined, total?: number): number | undefined {
    if (viewUrl === null && total !== undefined && data?.length && data.length >= total) {
      return data.length;
    }

    return undefined;
  }
}

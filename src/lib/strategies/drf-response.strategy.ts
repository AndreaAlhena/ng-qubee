import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the Django REST Framework (DRF) driver
 *
 * Parses DRF `PageNumberPagination` responses:
 *
 * ```json
 * {
 *   "count": 100,
 *   "next": "http://api.example.com/items/?page=3",
 *   "previous": "http://api.example.com/items/?page=1",
 *   "results": [...]
 * }
 * ```
 *
 * DRF emits no `current_page` field in the body, so this strategy
 * **derives** the current page (and the page size) by inspecting the
 * `next` / `previous` URLs:
 *
 * - `previous === null` → current page is **1**.
 * - `previous` set but has no `?page=N` param → DRF omits `page=1` from
 *   URLs when the previous page is the first, so we infer **2**.
 * - `previous` has `?page=N` → current page is **N + 1**.
 *
 * Similarly, `perPage` is parsed from any `?page_size=N` query param on
 * `next` or `previous`, and `lastPage` is computed as
 * `ceil(count / perPage)`. When `perPage` cannot be discovered (e.g. on a
 * single-page response that emits both URLs as `null`), `perPage` and
 * `lastPage` are left undefined.
 *
 * Key paths are resolved through `DrfResponseOptions`, which defaults
 * `data → 'results'`, `total → 'count'`, `nextPageUrl → 'next'`,
 * `prevPageUrl → 'previous'`. The current-page / per-page / last-page
 * paths default to empty strings — the strategy ignores `options` for
 * those slots and uses URL inspection instead.
 *
 * @see https://www.django-rest-framework.org/api-guide/pagination/#pagenumberpagination
 */
export class DrfResponseStrategy implements IResponseStrategy {

  /**
   * Parse a DRF pagination response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = response[options.data] as T[];
    const total = response[options.total] as number | undefined;
    const prevPageUrl = (response[options.prevPageUrl] ?? null) as string | null;
    const nextPageUrl = (response[options.nextPageUrl] ?? null) as string | null;

    const currentPage = this._deriveCurrentPage(prevPageUrl);
    const perPage = this._derivePerPage(nextPageUrl, prevPageUrl);
    const lastPage = this._deriveLastPage(total, perPage);

    const from = this._deriveFrom(currentPage, perPage);
    const to = this._deriveTo(currentPage, perPage, total);

    return new PaginatedCollection(
      data,
      currentPage,
      from,
      to,
      total,
      perPage,
      prevPageUrl ?? undefined,
      nextPageUrl ?? undefined,
      lastPage,
      undefined,
      undefined
    );
  }

  /**
   * Derive the current page number from the `previous` URL
   *
   * - `null` → page 1
   * - URL without `?page=N` → page 2 (DRF omits `page=1` from URLs)
   * - URL with `?page=N` → N + 1
   *
   * @param prevPageUrl - The `previous` link from the DRF response, or null
   * @returns The current page number
   */
  private _deriveCurrentPage(prevPageUrl: string | null): number {
    if (prevPageUrl === null) {
      return 1;
    }

    const prevPage = this._extractPageParam(prevPageUrl);

    return prevPage === undefined ? 2 : prevPage + 1;
  }

  /**
   * Derive `from` as the 1-indexed offset of the first item on this page
   *
   * @param currentPage - The current page number
   * @param perPage - The page size (may be undefined)
   * @returns The 1-indexed `from` index, or undefined when perPage is unknown
   */
  private _deriveFrom(currentPage: number, perPage?: number): number | undefined {
    if (!perPage) {
      return undefined;
    }

    return (currentPage - 1) * perPage + 1;
  }

  /**
   * Derive the last page number as `ceil(total / perPage)`
   *
   * Both inputs must be defined; an empty result set (`total === 0`)
   * yields `lastPage = 0` which the caller treats as "no useful info"
   * and skips the sync to `NestService.lastPage`.
   *
   * @param total - The total item count
   * @param perPage - The page size
   * @returns The last page number, or undefined when either input is missing
   */
  private _deriveLastPage(total?: number, perPage?: number): number | undefined {
    if (total === undefined || perPage === undefined || perPage <= 0) {
      return undefined;
    }

    return Math.ceil(total / perPage);
  }

  /**
   * Derive `perPage` by parsing `?page_size=N` from any available URL
   *
   * Tries `next` first (page 1 always has a `next` URL with `page_size`
   * if any non-default size was requested), then falls back to
   * `previous`. Returns undefined when neither URL contains the param —
   * the consumer is then on a single-page result with the server's
   * default page size, which is not introspectable from the body alone.
   *
   * @param nextPageUrl - The `next` link from the response, or null
   * @param prevPageUrl - The `previous` link from the response, or null
   * @returns The page size, or undefined
   */
  private _derivePerPage(nextPageUrl: string | null, prevPageUrl: string | null): number | undefined {
    return this._extractPageSizeParam(nextPageUrl) ?? this._extractPageSizeParam(prevPageUrl);
  }

  /**
   * Derive `to` as the 1-indexed offset of the last item on this page
   *
   * Clamped to `total` so the last page does not report past the end.
   *
   * @param currentPage - The current page number
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `to` index, or undefined when inputs insufficient
   */
  private _deriveTo(currentPage: number, perPage?: number, total?: number): number | undefined {
    if (perPage === undefined || total === undefined) {
      return undefined;
    }

    return Math.min(currentPage * perPage, total);
  }

  /**
   * Extract the `page` query parameter from a DRF pagination URL
   *
   * Returns the integer value of `?page=N`, or undefined when the URL is
   * malformed or has no `page` param (which, by DRF convention, means
   * page 1 — the caller infers the semantics).
   *
   * @param url - The URL to parse
   * @returns The integer page value, or undefined
   */
  private _extractPageParam(url: string): number | undefined {
    const raw = this._extractQueryParam(url, 'page');

    if (raw === undefined) {
      return undefined;
    }

    const parsed = Number.parseInt(raw, 10);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Extract the `page_size` query parameter from a DRF pagination URL
   *
   * @param url - The URL to parse (or null)
   * @returns The integer page-size value, or undefined
   */
  private _extractPageSizeParam(url: string | null): number | undefined {
    if (url === null) {
      return undefined;
    }

    const raw = this._extractQueryParam(url, 'page_size');

    if (raw === undefined) {
      return undefined;
    }

    const parsed = Number.parseInt(raw, 10);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Extract a single query parameter from a URL via the WHATWG URL parser
   *
   * Returns undefined when the URL is unparseable (relative URL without a
   * base, or malformed) or when the parameter is absent.
   *
   * @param url - The URL to parse
   * @param name - The query-parameter name to look up
   * @returns The raw string value of the parameter, or undefined
   */
  private _extractQueryParam(url: string, name: string): string | undefined {
    try {
      const parsed = new URL(url);
      const value = parsed.searchParams.get(name);

      return value === null ? undefined : value;
    } catch {
      return undefined;
    }
  }
}

import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the OData v4 driver
 *
 * Parses OData collection responses:
 *
 * ```json
 * {
 *   "@odata.context": "https://api.example.com/$metadata#Products",
 *   "@odata.count": 100,
 *   "@odata.nextLink": "https://api.example.com/Products?$count=true&$top=10&$skip=30",
 *   "value": [...]
 * }
 * ```
 *
 * OData emits no current-page or page-size field in the body, so this
 * strategy **derives** them by inspecting the `@odata.nextLink` URL:
 *
 * - `perPage` comes from the link's `$top` param, falling back to the
 *   item count of the current (necessarily full) page when the link
 *   carries no `$top`.
 * - `currentPage` is `$skip ÷ perPage` — the next page starts where the
 *   current one ends. Without a usable link (`$skiptoken`-based
 *   server-driven paging, or the last page) the strategy falls back to
 *   page **1**, which is only guaranteed correct for single-page results.
 * - `lastPage` is `ceil(total ÷ perPage)`; on a link-less response it
 *   resolves to 1 when the page provably holds the whole result set.
 *
 * The total requires `$count=true` on the request — the request strategy
 * always emits it. Envelope keys contain **literal dots** (`@odata.count`),
 * so key paths from `OdataResponseOptions` are read with flat bracket
 * access, never dot-path traversal.
 *
 * @see https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html
 */
export class OdataResponseStrategy implements IResponseStrategy {

  /**
   * Parse an OData collection response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = response[options.data] as T[];
    const total = response[options.total] as number | undefined;
    const nextPageUrl = (response[options.nextPageUrl] ?? null) as string | null;

    const perPage = this._derivePerPage(nextPageUrl, data);
    const currentPage = this._deriveCurrentPage(nextPageUrl, perPage);
    const lastPage = this._deriveLastPage(nextPageUrl, data, total, perPage);

    const from = this._deriveFrom(nextPageUrl, data, currentPage, perPage);
    const to = this._deriveTo(nextPageUrl, data, currentPage, perPage, total);

    return new PaginatedCollection(
      data,
      currentPage,
      from,
      to,
      total,
      perPage,
      undefined,
      nextPageUrl ?? undefined,
      lastPage,
      undefined,
      undefined
    );
  }

  /**
   * Derive the current page number from the `@odata.nextLink` URL
   *
   * The next page starts where the current one ends, so
   * `currentPage = $skip ÷ perPage` (e.g. `$skip=30` with `$top=10` →
   * page 3). Falls back to **1** when the link is absent (last or only
   * page), carries no `$skip` (`$skiptoken`-based paging), or the page
   * size is unknown.
   *
   * @param nextPageUrl - The `@odata.nextLink` from the response, or null
   * @param perPage - The derived page size (may be undefined)
   * @returns The current page number
   */
  private _deriveCurrentPage(nextPageUrl: string | null, perPage?: number): number {
    if (nextPageUrl === null || !perPage) {
      return 1;
    }

    const skip = this._extractNumberParam(nextPageUrl, '$skip');

    if (skip === undefined) {
      return 1;
    }

    return Math.ceil(skip / perPage);
  }

  /**
   * Derive `from` as the 1-indexed offset of the first item on this page
   *
   * Computed from `currentPage` × `perPage` when the page size is known;
   * on a link-less single page it is 1 whenever items are present.
   *
   * @param nextPageUrl - The `@odata.nextLink` from the response, or null
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param perPage - The page size (may be undefined)
   * @returns The 1-indexed `from` index, or undefined when inputs insufficient
   */
  private _deriveFrom(nextPageUrl: string | null, data: unknown[] | undefined, currentPage: number, perPage?: number): number | undefined {
    if (perPage) {
      return (currentPage - 1) * perPage + 1;
    }

    if (nextPageUrl === null && data?.length) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive the last page number
   *
   * `ceil(total ÷ perPage)` when both are known; a link-less response
   * that provably holds the entire non-empty result set resolves to 1.
   *
   * @param nextPageUrl - The `@odata.nextLink` from the response, or null
   * @param data - The items on the current page
   * @param total - The total item count
   * @param perPage - The page size
   * @returns The last page number, or undefined when inputs insufficient
   */
  private _deriveLastPage(nextPageUrl: string | null, data: unknown[] | undefined, total?: number, perPage?: number): number | undefined {
    if (total !== undefined && perPage !== undefined && perPage > 0) {
      return Math.ceil(total / perPage);
    }

    if (nextPageUrl === null && total !== undefined && total > 0 && (data?.length ?? 0) >= total) {
      return 1;
    }

    return undefined;
  }

  /**
   * Derive `perPage` from the `@odata.nextLink` URL
   *
   * Reads the link's `$top` param. When the link exists but carries no
   * `$top` (server-driven page size), the current page is necessarily
   * full, so its item count equals the page size. Without a link the
   * page may be partial and the size is not introspectable.
   *
   * @param nextPageUrl - The `@odata.nextLink` from the response, or null
   * @param data - The items on the current page
   * @returns The page size, or undefined
   */
  private _derivePerPage(nextPageUrl: string | null, data: unknown[] | undefined): number | undefined {
    if (nextPageUrl === null) {
      return undefined;
    }

    return this._extractNumberParam(nextPageUrl, '$top') ?? (data?.length || undefined);
  }

  /**
   * Derive `to` as the 1-indexed offset of the last item on this page
   *
   * Clamped to `total` so the last page does not report past the end;
   * on a link-less single page it is the item count.
   *
   * @param nextPageUrl - The `@odata.nextLink` from the response, or null
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `to` index, or undefined when inputs insufficient
   */
  private _deriveTo(nextPageUrl: string | null, data: unknown[] | undefined, currentPage: number, perPage?: number, total?: number): number | undefined {
    if (perPage !== undefined && total !== undefined) {
      return Math.min(currentPage * perPage, total);
    }

    if (nextPageUrl === null && data?.length) {
      return data.length;
    }

    return undefined;
  }

  /**
   * Extract an integer query parameter from an OData pagination URL
   *
   * @param url - The URL to parse
   * @param name - The query-parameter name to look up (e.g. `$skip`)
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
   * OData permits **relative** `@odata.nextLink` values, so parsing
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
}

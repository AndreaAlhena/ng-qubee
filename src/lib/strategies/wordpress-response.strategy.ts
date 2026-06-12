import { HeaderBag, readHeader } from '../interfaces/header-bag.interface';
import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Internal shape holding the navigation URLs parsed out of a `Link`
 * header. Both are optional: page 1 has no `prev`, the last page has no
 * `next`, and a single-page result has neither.
 */
interface ILinkRelations {
  next?: string;
  prev?: string;
}

/**
 * Response strategy for the WordPress REST API driver
 *
 * WordPress returns a bare array body for collection endpoints.
 * Pagination metadata travels in HTTP response headers:
 *
 * - `X-WP-Total` — total number of records in the collection
 * - `X-WP-TotalPages` — total number of pages at the requested
 *   `per_page`
 * - `Link` — RFC 5988 navigation links (`rel="next"` / `rel="prev"`)
 *
 * The strategy surfaces the `Link` URLs as `nextPageUrl` /
 * `prevPageUrl` and derives position from them:
 *
 * - `currentPage` is the `prev` link's `page` param + 1 (no `prev` →
 *   page **1**), falling back to the `next` link's `page` param − 1.
 * - `perPage` is the item count of the current page whenever a `next`
 *   link exists (a page with a successor is necessarily full); on the
 *   last page of a multi-page set it is not introspectable and stays
 *   `undefined`.
 * - `from`/`to` derive from `currentPage` × `perPage` on full pages,
 *   or count back from the total on the last page
 *   (`from = total - data.length + 1`, `to = total`).
 *
 * This strategy expects the consumer to pass the array body as
 * `response` (or a plain object with `response[options.data]` pointing
 * at the array) and the response headers via the optional `headers`
 * bag — the same call-site shape as the PostgREST driver. Omitted
 * headers are tolerated and yield a collection with `undefined`
 * bounds.
 *
 * @see https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
 */
export class WordpressResponseStrategy implements IResponseStrategy {

  private static readonly _linkHeader = 'Link';
  private static readonly _linkRegex = /<([^>]+)>\s*;\s*rel="(next|prev)"/g;
  private static readonly _pageParamRegex = /[?&]page=(\d+)/;
  private static readonly _totalHeader = 'X-WP-Total';
  private static readonly _totalPagesHeader = 'X-WP-TotalPages';

  /**
   * Parse a WordPress REST response into a typed PaginatedCollection
   *
   * @param response - The raw response. Either the array body directly, or
   * an object with the array at `response[options.data]`.
   * @param options - The response key configuration (only `options.data` is
   * consulted; all pagination metadata comes from headers).
   * @param headers - Optional HTTP response headers. `X-WP-Total` /
   * `X-WP-TotalPages` drive the totals and the `Link` header drives
   * navigation and page derivation; omission is tolerated.
   * @returns A typed PaginatedCollection instance
   */
  public paginate<T extends IPaginatedObject>(
    response: Record<string, unknown>,
    options: ResponseOptions,
    headers?: HeaderBag
  ): PaginatedCollection<T> {
    // Body may be a bare array or an envelope with the array at options.data
    const data = (Array.isArray(response) ? response : response[options.data]) as T[];

    // Header-driven pagination metadata
    const total = this._parseCount(readHeader(headers, WordpressResponseStrategy._totalHeader));
    const lastPage = this._parseCount(readHeader(headers, WordpressResponseStrategy._totalPagesHeader));
    const { next, prev } = this._parseLinkHeader(readHeader(headers, WordpressResponseStrategy._linkHeader));

    const currentPage = this._deriveCurrentPage(next, prev);
    const perPage = next !== undefined ? (data?.length || undefined) : undefined;

    const from = this._deriveFrom(data, currentPage, next, perPage, total);
    const to = this._deriveTo(data, currentPage, next, perPage, total);

    return new PaginatedCollection(
      data,
      currentPage,
      from,
      to,
      total,
      perPage,
      prev,
      next,
      lastPage,
      undefined,
      undefined
    );
  }

  /**
   * Derive the current page from the Link relations
   *
   * The `prev` URL's `page` param + 1 is authoritative; without a
   * `prev` the page is 1 unless a `next` URL contradicts it (its page
   * param − 1). A missing/unparseable Link header yields page 1.
   *
   * @param next - The `rel="next"` URL, if present
   * @param prev - The `rel="prev"` URL, if present
   * @returns The 1-indexed current page
   */
  private _deriveCurrentPage(next?: string, prev?: string): number {
    const prevPage = this._pageParam(prev);

    if (prevPage !== undefined) {
      return prevPage + 1;
    }

    const nextPage = this._pageParam(next);

    if (nextPage !== undefined) {
      return Math.max(nextPage - 1, 1);
    }

    return 1;
  }

  /**
   * Derive `from` as the 1-indexed offset of the first item on this page
   *
   * Computed from `currentPage` × `perPage` on full pages; on the last
   * page (no `next` link) it counts back from the total
   * (`total - items + 1`), which also covers single-page responses.
   *
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param next - The `rel="next"` URL, if present
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `from` index, or undefined when inputs insufficient
   */
  private _deriveFrom(data: unknown[] | undefined, currentPage: number, next?: string, perPage?: number, total?: number): number | undefined {
    if (perPage) {
      return (currentPage - 1) * perPage + 1;
    }

    if (next === undefined && total !== undefined && data?.length) {
      return total - data.length + 1;
    }

    return undefined;
  }

  /**
   * Derive `to` as the 1-indexed offset of the last item on this page
   *
   * Clamped to `total` so the last page does not report past the end;
   * on the last page (no `next` link) it is simply the total.
   *
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param next - The `rel="next"` URL, if present
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `to` index, or undefined when inputs insufficient
   */
  private _deriveTo(data: unknown[] | undefined, currentPage: number, next?: string, perPage?: number, total?: number): number | undefined {
    if (perPage !== undefined && total !== undefined) {
      return Math.min(currentPage * perPage, total);
    }

    if (next === undefined && total !== undefined && data?.length) {
      return total;
    }

    return undefined;
  }

  /**
   * Extract the `page` query param from a navigation URL
   *
   * @param url - The URL to inspect (possibly undefined)
   * @returns The parsed page number, or undefined
   */
  private _pageParam(url?: string): number | undefined {
    if (!url) {
      return undefined;
    }

    const match = url.match(WordpressResponseStrategy._pageParamRegex);

    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Parse a non-negative integer count header value
   *
   * @param value - Raw header value (possibly null/undefined)
   * @returns The parsed count, or undefined when absent or unparseable
   */
  private _parseCount(value: string | null | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = parseInt(value.trim(), 10);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Extract the `rel="next"` / `rel="prev"` URLs from an RFC 5988
   * `Link` header value
   *
   * Tolerates any ordering, extra relations (`rel="collection"` etc.
   * are ignored), and a missing header.
   *
   * @param value - Raw header value (possibly null/undefined)
   * @returns The navigation URLs found, keyed by relation
   */
  private _parseLinkHeader(value: string | null | undefined): ILinkRelations {
    if (!value) {
      return {};
    }

    const relations: ILinkRelations = {};
    const regex = new RegExp(WordpressResponseStrategy._linkRegex.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(value)) !== null) {
      relations[match[2] as keyof ILinkRelations] = match[1];
    }

    return relations;
  }
}

import { HeaderBag, readHeader } from '../interfaces/header-bag.interface';
import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Internal shape holding the three values parsed out of a `Content-Range`
 * header. All three are optional because PostgREST may legitimately emit a
 * malformed header (or none at all, when the client didn't opt into counts
 * via `Prefer: count=exact`).
 */
interface IContentRangeParts {
  from?: number;
  to?: number;
  total?: number;
}

/**
 * Response strategy for the PostgREST driver
 *
 * PostgREST (and Supabase, which wraps it) returns a bare array body for
 * collection endpoints. Pagination metadata is carried in the
 * `Content-Range` HTTP response header, e.g. `0-9/50` meaning "items 0–9
 * out of 50 total". Consumers opt into totals by sending the
 * `Prefer: count=exact` request header.
 *
 * This strategy expects the consumer to pass the array body as `response`
 * (or a plain object with `response[options.data]` pointing at the array)
 * and the response headers via the optional `headers` bag. See
 * `PaginationService.paginate()` for the call-site shape.
 *
 * @see https://postgrest.org/en/stable/references/api/pagination_count.html
 */
export class PostgrestResponseStrategy implements IResponseStrategy {

  private static readonly _contentRangeHeader = 'Content-Range';
  private static readonly _contentRangeRegex = /^(\d+)-(\d+)\/(\*|\d+)$/;

  /**
   * Parse a PostgREST response into a typed PaginatedCollection
   *
   * @param response - The raw response. Either the array body directly, or
   * an object with the array at `response[options.data]`.
   * @param options - The response key configuration (only `options.data` is
   * consulted; all pagination metadata comes from the Content-Range header).
   * @param headers - Optional HTTP response headers. The `Content-Range`
   * header drives page/total derivation; omission is tolerated and yields
   * a collection with `undefined` bounds (auto-sync will leave
   * `isLastPageKnown` at `false`).
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
    const contentRange = readHeader(headers, PostgrestResponseStrategy._contentRangeHeader);
    const { from, to, total } = this._parseContentRange(contentRange);

    // Per-page can only be derived from the from/to range; fall back to undefined
    const perPage = (from !== undefined && to !== undefined) ? (to - from + 1) : undefined;

    // Page is 1-based in ng-qubee state; PostgREST reports 0-based indices
    const page = (perPage && from !== undefined) ? Math.floor(from / perPage) + 1 : 1;
    const lastPage = (total !== undefined && perPage) ? Math.ceil(total / perPage) : undefined;

    // Library convention: from/to are 1-indexed and inclusive; PostgREST emits 0-indexed
    const fromOneIndexed = from !== undefined ? from + 1 : undefined;
    const toOneIndexed = to !== undefined ? to + 1 : undefined;

    // PostgREST does not emit page URLs, so prev/next/first/last URLs stay undefined
    return new PaginatedCollection<T>(
      data,
      page,
      fromOneIndexed,
      toOneIndexed,
      total,
      perPage,
      undefined,
      undefined,
      lastPage
    );
  }

  /**
   * Extract `{from, to, total}` from a PostgREST `Content-Range` value
   *
   * Expected format: `<from>-<to>/<total|*>`. Any shape mismatch returns
   * an empty object; `*` as the total yields `total: undefined`.
   *
   * @param value - Raw header value (possibly null/undefined)
   * @returns Parsed integers; missing fields indicate an unparseable header
   */
  private _parseContentRange(value: string | null | undefined): IContentRangeParts {
    if (!value) {
      return {};
    }

    const match = value.trim().match(PostgrestResponseStrategy._contentRangeRegex);

    if (!match) {
      return {};
    }

    const from = parseInt(match[1], 10);
    const to = parseInt(match[2], 10);
    const total = match[3] === '*' ? undefined : parseInt(match[3], 10);

    return { from, to, total };
  }
}

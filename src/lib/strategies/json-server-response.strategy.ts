import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the json-server driver
 *
 * Parses json-server v1 paginated responses:
 *
 * ```json
 * {
 *   "first": 1,
 *   "prev": null,
 *   "next": 2,
 *   "last": 5,
 *   "pages": 5,
 *   "items": 48,
 *   "data": [...]
 * }
 * ```
 *
 * Uniquely among the drivers, `first` / `prev` / `next` / `last` are
 * **page numbers**, not URLs — so the navigation-URL slots on
 * `PaginatedCollection` stay `undefined` and the strategy instead uses
 * the numbers to derive position:
 *
 * - `currentPage` is `prev + 1` (`prev === null` → page **1**).
 * - `perPage` is the item count of the current page whenever `next` is
 *   set (a page with a successor is necessarily full); on the last page
 *   of a multi-page set it is not introspectable and stays `undefined`.
 * - `lastPage` comes straight from `pages`; `from`/`to` derive from
 *   `currentPage` × `perPage` on full pages, or count back from the
 *   total on the last page (`from = total - items + 1`, `to = total`).
 *
 * The `data` / `items` / `pages` key paths are configurable through
 * `JsonServerResponseOptions`; the `prev` / `next` keys are fixed by the
 * json-server envelope and live as private statics.
 *
 * @see https://github.com/typicode/json-server
 */
export class JsonServerResponseStrategy implements IResponseStrategy {

  /**
   * json-server-native names of the page-number navigation keys
   *
   * Fixed by the v1 envelope; read for derivation only and never
   * surfaced as URLs.
   */
  private static readonly _nextKey = 'next';
  private static readonly _prevKey = 'prev';

  /**
   * Parse a json-server pagination response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = response[options.data] as T[];
    const total = response[options.total] as number | undefined;
    const lastPage = response[options.lastPage] as number | undefined;
    const prev = (response[JsonServerResponseStrategy._prevKey] ?? null) as number | null;
    const next = (response[JsonServerResponseStrategy._nextKey] ?? null) as number | null;

    const currentPage = prev === null ? 1 : prev + 1;
    const perPage = this._derivePerPage(next, data);

    const from = this._deriveFrom(data, currentPage, next, perPage, total);
    const to = this._deriveTo(data, currentPage, next, perPage, total);

    return new PaginatedCollection(
      data,
      currentPage,
      from,
      to,
      total,
      perPage,
      undefined,
      undefined,
      lastPage,
      undefined,
      undefined
    );
  }

  /**
   * Derive `from` as the 1-indexed offset of the first item on this page
   *
   * Computed from `currentPage` × `perPage` on full pages; on the last
   * page (no `next`) it counts back from the total
   * (`total - items + 1`), which also covers single-page responses.
   *
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param next - The next page number, or null
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `from` index, or undefined when inputs insufficient
   */
  private _deriveFrom(data: unknown[] | undefined, currentPage: number, next: number | null, perPage?: number, total?: number): number | undefined {
    if (perPage) {
      return (currentPage - 1) * perPage + 1;
    }

    if (next === null && total !== undefined && data?.length) {
      return total - data.length + 1;
    }

    return undefined;
  }

  /**
   * Derive `perPage` from the current page's item count
   *
   * A page with a `next` successor is necessarily full, so its item
   * count equals the page size. Without a successor the page may be
   * partial and the size is not introspectable from the body alone.
   *
   * @param next - The next page number, or null
   * @param data - The items on the current page
   * @returns The page size, or undefined
   */
  private _derivePerPage(next: number | null, data: unknown[] | undefined): number | undefined {
    if (next === null) {
      return undefined;
    }

    return data?.length || undefined;
  }

  /**
   * Derive `to` as the 1-indexed offset of the last item on this page
   *
   * Clamped to `total` so the last page does not report past the end;
   * on the last page (no `next`) it is simply the total.
   *
   * @param data - The items on the current page
   * @param currentPage - The current page number
   * @param next - The next page number, or null
   * @param perPage - The page size (may be undefined)
   * @param total - The total item count (may be undefined)
   * @returns The 1-indexed `to` index, or undefined when inputs insufficient
   */
  private _deriveTo(data: unknown[] | undefined, currentPage: number, next: number | null, perPage?: number, total?: number): number | undefined {
    if (perPage !== undefined && total !== undefined) {
      return Math.min(currentPage * perPage, total);
    }

    if (next === null && total !== undefined && data?.length) {
      return total;
    }

    return undefined;
  }
}

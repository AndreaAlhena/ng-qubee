import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Response strategy for the FeathersJS driver
 *
 * Parses the paginated envelope emitted by Feathers database adapters:
 *
 * ```json
 * {
 *   "total": 48,
 *   "limit": 10,
 *   "skip": 10,
 *   "data": [...]
 * }
 * ```
 *
 * The envelope is offset-based — no page number, no navigation URLs —
 * so position derives arithmetically:
 *
 * - `currentPage` is `skip / limit + 1` (integer division; a zero or
 *   missing `limit` falls back to page **1**).
 * - `perPage` comes straight from `limit`; `lastPage` is
 *   `ceil(total / limit)`.
 * - `from`/`to` are 1-indexed offsets derived from `skip` and the item
 *   count of the current page (`from = skip + 1`,
 *   `to = skip + data.length`); both stay `undefined` on an empty page.
 *
 * The `data` / `total` / `limit` key names are configurable through
 * `FeathersResponseOptions`; the `skip` key is fixed by the Feathers
 * envelope and lives as a private static.
 *
 * @see https://feathersjs.com/api/databases/common#pagination
 */
export class FeathersResponseStrategy implements IResponseStrategy {

  /**
   * Feathers-native name of the offset key
   *
   * Fixed by the adapter envelope; read for page derivation only.
   */
  private static readonly _skipKey = 'skip';

  /**
   * Parse a Feathers pagination response into a PaginatedCollection
   *
   * @param response - The raw API response body
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = response[options.data] as T[];
    const total = response[options.total] as number | undefined;
    const perPage = response[options.perPage] as number | undefined;
    const skip = (response[FeathersResponseStrategy._skipKey] ?? 0) as number;

    const currentPage = perPage ? Math.floor(skip / perPage) + 1 : 1;
    const lastPage = (total !== undefined && perPage) ? Math.ceil(total / perPage) : undefined;

    const from = data?.length ? skip + 1 : undefined;
    const to = data?.length ? skip + data.length : undefined;

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
}

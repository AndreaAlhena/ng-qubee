import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Base class for response strategies whose pagination metadata lives at
 * dot-notation paths inside the response body
 *
 * JSON:API and NestJS share an identical body-traversal algorithm: the
 * total / current-page / etc. live at nested keys like `meta.total`, and
 * `from`/`to` are either present directly or must be derived from
 * `currentPage` × `perPage`. Both strategies were duplicating this
 * verbatim before this base existed; concrete classes now extend and
 * provide only the docstring describing their driver's specific path
 * conventions (see `JsonApiResponseStrategy`, `NestjsResponseStrategy`).
 *
 * Drivers whose pagination metadata travels via HTTP headers (PostgREST)
 * or whose body has a flat shape with no dot paths (Laravel, Spatie) do
 * not extend this class — they implement `IResponseStrategy` directly.
 */
export abstract class AbstractDotPathResponseStrategy implements IResponseStrategy {

  /**
   * Parse a nested-envelope pagination response into a PaginatedCollection
   *
   * @param response - The raw API response object
   * @param options - The response key name configuration (dot-notation paths supported)
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: Record<string, any>, options: ResponseOptions): PaginatedCollection<T> {
    const data = this.resolve(response, options.data) as T[];
    const currentPage = this.resolve(response, options.currentPage) as number;
    const total = this.resolve(response, options.total) as number | undefined;
    const perPage = this.resolve(response, options.perPage) as number | undefined;
    const lastPage = this.resolve(response, options.lastPage) as number | undefined;

    // Compute from/to if not directly available
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
   * Resolve a value from a response object using a dot-notation path
   *
   * Supports both flat keys (`'data'`) and nested paths (`'meta.totalItems'`).
   *
   * @param response - The raw response object
   * @param path - The dot-notation path to resolve
   * @returns The resolved value, or undefined if any segment is missing
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected resolve(response: Record<string, any>, path: string): unknown {
    return path.split('.').reduce((obj, key) => obj?.[key], response);
  }

  /**
   * Resolve the "from" index value
   *
   * If `options.from` resolves to a value in the response, use it.
   * Otherwise compute `(currentPage - 1) * perPage + 1` when both are known.
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @param currentPage - The current page number
   * @param perPage - The number of items per page
   * @returns The "from" index, or `undefined` when neither path nor inputs suffice
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected resolveFrom(response: Record<string, any>, options: ResponseOptions, currentPage: number, perPage?: number): number | undefined {
    const direct = this.resolve(response, options.from);

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
   * If `options.to` resolves to a value in the response, use it.
   * Otherwise compute `Math.min(currentPage * perPage, total)` when all
   * three are known.
   *
   * @param response - The raw response object
   * @param options - The response key name configuration
   * @param currentPage - The current page number
   * @param perPage - The number of items per page
   * @param total - The total number of items
   * @returns The "to" index, or `undefined` when neither path nor inputs suffice
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected resolveTo(response: Record<string, any>, options: ResponseOptions, currentPage: number, perPage?: number, total?: number): number | undefined {
    const direct = this.resolve(response, options.to);

    if (direct !== undefined) {
      return direct as number;
    }

    if (currentPage && perPage && total) {
      return Math.min(currentPage * perPage, total);
    }

    return undefined;
  }
}

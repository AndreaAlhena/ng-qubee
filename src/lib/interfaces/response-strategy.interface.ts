import { HeaderBag } from './header-bag.interface';
import { IPaginatedObject } from './paginated-object.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

/**
 * Strategy interface for parsing paginated API responses
 *
 * Each driver implements this interface to parse responses
 * from the corresponding backend format into a PaginatedCollection.
 */
export interface IResponseStrategy {

  /**
   * Parse a raw API response into a typed PaginatedCollection
   *
   * @param response - The raw API response object (body). For drivers that
   * emit a bare array body (e.g. PostgREST), pass the array here.
   * @param options - The response key name configuration
   * @param headers - Optional HTTP response headers. Drivers that carry
   * pagination metadata in headers (PostgREST's `Content-Range`) read from
   * this bag; body-only drivers ignore it. Accepts anything with a `.get()`
   * accessor (`HttpHeaders`, `Headers`) or a plain `Record<string, string>`.
   * @returns A typed PaginatedCollection instance
   */
  paginate<T extends IPaginatedObject>(
    response: Record<string, unknown>,
    options: ResponseOptions,
    headers?: HeaderBag
  ): PaginatedCollection<T>;
}

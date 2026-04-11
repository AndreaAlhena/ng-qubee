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
   * @param response - The raw API response object
   * @param options - The response key name configuration
   * @returns A typed PaginatedCollection instance
   */
  paginate<T extends IPaginatedObject>(response: Record<string, unknown>, options: ResponseOptions): PaginatedCollection<T>;
}

import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IPaginationConfig } from '../interfaces/pagination-config.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';

export class PaginationService {

  /**
   * Resolved response key name options
   */
  private _options: ResponseOptions;

  /**
   * The response strategy that parses responses for the active driver
   */
  private _responseStrategy: IResponseStrategy;

  constructor(
    responseStrategy: IResponseStrategy,
    options: IPaginationConfig = {}
  ) {
    this._options = new ResponseOptions(options);
    this._responseStrategy = responseStrategy;
  }

  /**
   * Transform a raw API response into a typed PaginatedCollection
   *
   * Delegates to the active driver's response strategy for parsing.
   *
   * @param response - The raw API response object
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: { [key: string]: any }): PaginatedCollection<T> {
    return this._responseStrategy.paginate<T>(response, this._options);
  }
}

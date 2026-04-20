import { Inject, Injectable } from '@angular/core';

import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';
import { NG_QUBEE_RESPONSE_OPTIONS, NG_QUBEE_RESPONSE_STRATEGY } from '../tokens/ng-qubee.tokens';

@Injectable()
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
    @Inject(NG_QUBEE_RESPONSE_STRATEGY) responseStrategy: IResponseStrategy,
    @Inject(NG_QUBEE_RESPONSE_OPTIONS) options: ResponseOptions = new ResponseOptions({})
  ) {
    this._options = options;
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

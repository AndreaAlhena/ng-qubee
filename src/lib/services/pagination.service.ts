import { Inject, Injectable } from '@angular/core';

import { HeaderBag } from '../interfaces/header-bag.interface';
import { IPaginatedObject } from '../interfaces/paginated-object.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { PaginatedCollection } from '../models/paginated-collection';
import { ResponseOptions } from '../models/response-options';
import { NestService } from './nest.service';
import { NG_QUBEE_RESPONSE_OPTIONS, NG_QUBEE_RESPONSE_STRATEGY } from '../tokens/ng-qubee.tokens';

@Injectable()
export class PaginationService {

  /**
   * The NestService instance that owns the query-builder state for this
   * PaginationService's scope (environment-level by default, or
   * component-level when used via `provideNgQubeeInstance()`)
   */
  private _nestService: NestService;

  /**
   * Resolved response key name options
   */
  private _options: ResponseOptions;

  /**
   * The response strategy that parses responses for the active driver
   */
  private _responseStrategy: IResponseStrategy;

  constructor(
    nestService: NestService,
    @Inject(NG_QUBEE_RESPONSE_STRATEGY) responseStrategy: IResponseStrategy,
    @Inject(NG_QUBEE_RESPONSE_OPTIONS) options: ResponseOptions = new ResponseOptions({})
  ) {
    this._nestService = nestService;
    this._options = options;
    this._responseStrategy = responseStrategy;
  }

  /**
   * Transform a raw API response into a typed PaginatedCollection
   *
   * Delegates to the active driver's response strategy for parsing, then
   * auto-syncs the parsed `page` and `lastPage` back into `NestService`
   * so pagination navigation helpers on `NgQubeeService` can operate
   * against the live server-reported bounds without consumer bookkeeping.
   *
   * @remarks
   * `lastPage` is only synced when the response yields a positive integer.
   * Server-emitted `0` (empty collection edge case) and absent fields are
   * treated as "no useful info" and leave `isLastPageKnown: false`.
   *
   * @param response - The raw API response body. For drivers that emit a
   * bare array (PostgREST), pass the array.
   * @param headers - Optional HTTP response headers. Required by the
   * PostgREST driver (reads `Content-Range` for pagination metadata);
   * body-only drivers ignore it. Accepts Angular's `HttpHeaders`, the
   * native `Headers` class, or a plain `Record<string, string>`.
   * @returns A typed PaginatedCollection instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paginate<T extends IPaginatedObject>(response: { [key: string]: any }, headers?: HeaderBag): PaginatedCollection<T> {
    const collection = this._responseStrategy.paginate<T>(response, this._options, headers);

    this._nestService.page = collection.page;

    if (typeof collection.lastPage === 'number' && Number.isInteger(collection.lastPage) && collection.lastPage > 0) {
      this._nestService.syncLastPage(collection.lastPage);
    }

    return collection;
  }
}

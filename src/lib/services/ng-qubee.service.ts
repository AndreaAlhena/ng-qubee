import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, throwError } from 'rxjs';

// Enums
import { DriverEnum } from '../enums/driver.enum';
import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';

// Errors
import { InvalidPageNumberError } from '../errors/invalid-page-number.error';
import { PaginationNotSyncedError } from '../errors/pagination-not-synced.error';
import { UnsupportedFieldSelectionError } from '../errors/unsupported-field-selection.error';
import { UnsupportedFilterError } from '../errors/unsupported-filter.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { UnsupportedIncludesError } from '../errors/unsupported-includes.error';
import { UnsupportedSearchError } from '../errors/unsupported-search.error';
import { UnsupportedSelectError } from '../errors/unsupported-select.error';
import { UnsupportedSortError } from '../errors/unsupported-sort.error';

// Interfaces
import { IFields } from '../interfaces/fields.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';

// Models
import { QueryBuilderOptions } from '../models/query-builder-options';

// Services
import { NestService } from './nest.service';

// Tokens
import { NG_QUBEE_DRIVER, NG_QUBEE_REQUEST_OPTIONS, NG_QUBEE_REQUEST_STRATEGY } from '../tokens/ng-qubee.tokens';

@Injectable()
export class NgQubeeService {

  /**
   * The active pagination driver
   */
  private _driver: DriverEnum;

  /**
   * Resolved query parameter key name options
   */
  private _options: QueryBuilderOptions;

  /**
   * The request strategy that builds URIs for the active driver
   */
  private _requestStrategy: IRequestStrategy;

  /**
   * Internal BehaviorSubject that holds the latest generated URI
   */
  private _uri$: BehaviorSubject<string> = new BehaviorSubject('');

  /**
   * Observable that emits non-empty generated URIs
   */
  public uri$: Observable<string> = this._uri$.asObservable().pipe(
    filter(uri => !!uri)
  );

  constructor(
    private _nestService: NestService,
    @Inject(NG_QUBEE_REQUEST_STRATEGY) requestStrategy: IRequestStrategy,
    @Inject(NG_QUBEE_DRIVER) driver: DriverEnum,
    @Inject(NG_QUBEE_REQUEST_OPTIONS) options: QueryBuilderOptions = new QueryBuilderOptions({})
  ) {
    this._driver = driver;
    this._options = options;
    this._requestStrategy = requestStrategy;
  }

  /**
   * Assert that the active driver is one of the allowed drivers
   *
   * @param allowed - The allowed drivers
   * @param error - The error to throw if the driver is not allowed
   * @throws The provided error if the active driver is not in the allowed list
   */
  private _assertDriver(allowed: DriverEnum[], error: Error): void {
    if (!allowed.includes(this._driver)) {
      throw error;
    }
  }

  /**
   * Add fields to the select statement for the given model (JSON:API and Spatie only)
   *
   * @param model - Model that holds the fields
   * @param fields - Fields to select
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public addFields(model: string, fields: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.SPATIE], new UnsupportedFieldSelectionError());

    if (!fields.length) {
      return this;
    }

    this._nestService.addFields({ [model]: fields });

    return this;
  }

  /**
   * Add a filter with the given value(s) (JSON:API, NestJS, PostgREST, and Spatie)
   *
   * Produces: `filter[field]=value` (JSON:API / Spatie) or `filter.field=value` (NestJS)
   *
   * @param {string} field - Name of the field to filter
   * @param {(string | number | boolean)[]} values - The needle(s)
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public addFilter(field: string, ...values: (string | number | boolean)[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.POSTGREST, DriverEnum.SPATIE], new UnsupportedFilterError());

    if (!values.length) {
      return this;
    }

    this._nestService.addFilters({
      [field]: values
    });
    this._nestService.page = 1;

    return this;
  }

  /**
   * Add a filter with an explicit operator (NestJS and PostgREST)
   *
   * Produces: `filter.field=$operator:value`
   *
   * @param {string} field - Name of the field to filter
   * @param {FilterOperatorEnum} operator - The filter operator to apply
   * @param {(string | number | boolean)[]} values - The value(s) for the filter
   * @returns {this}
   * @throws {UnsupportedFilterOperatorError} If the active driver does not support filter operators
   */
  public addFilterOperator(field: string, operator: FilterOperatorEnum, ...values: (string | number | boolean)[]): this {
    this._assertDriver([DriverEnum.NESTJS, DriverEnum.POSTGREST], new UnsupportedFilterOperatorError());

    if (!values.length) {
      return this;
    }

    this._nestService.addOperatorFilters([{ field, operator, values }]);
    this._nestService.page = 1;

    return this;
  }

  /**
   * Add related entities to include in the request (JSON:API and Spatie only)
   *
   * @param {string[]} models - Models to include
   * @returns {this}
   * @throws {UnsupportedIncludesError} If the active driver does not support includes
   */
  public addIncludes(...models: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.SPATIE], new UnsupportedIncludesError());

    if (!models.length) {
      return this;
    }

    this._nestService.addIncludes(models);

    return this;
  }

  /**
   * Add flat field selection (NestJS and PostgREST)
   *
   * Produces: `select=col1,col2`
   *
   * @param {string[]} fields - Fields to select
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public addSelect(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS, DriverEnum.POSTGREST], new UnsupportedSelectError());

    if (!fields.length) {
      return this;
    }

    this._nestService.addSelect(fields);

    return this;
  }

  /**
   * Add a field with a sort criteria (JSON:API, NestJS, PostgREST, and Spatie)
   *
   * @param field - Field to use for sorting
   * @param {SortEnum} order - A value from the SortEnum enumeration
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public addSort(field: string, order: SortEnum): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.POSTGREST, DriverEnum.SPATIE], new UnsupportedSortError());

    this._nestService.addSort({
      field,
      order
    });
    this._nestService.page = 1;

    return this;
  }

  /**
   * Get the current page number
   *
   * @remarks Always safe to call. Thin accessor over the internal state's `page` field.
   * @returns The current page number
   */
  public currentPage(): number {
    return this._nestService.nest().page;
  }

  /**
   * Delete selected fields for the given models in the current query builder state (JSON:API and Spatie only)
   *
   * ```
   * ngQubeeService.deleteFields({
   *   users: ['email', 'password'],
   *   address: ['zipcode']
   * });
   * ```
   *
   * @param {IFields} fields - Object mapping model names to field arrays to remove
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public deleteFields(fields: IFields): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.SPATIE], new UnsupportedFieldSelectionError());
    this._nestService.deleteFields(fields);

    return this;
  }

  /**
   * Delete selected fields for the given model in the current query builder state (JSON:API and Spatie only)
   *
   * ```
   * ngQubeeService.deleteFieldsByModel('users', 'email', 'password');
   * ```
   *
   * @param model - Model that holds the fields
   * @param {string[]} fields - Fields to delete from the state
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public deleteFieldsByModel(model: string, ...fields: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.SPATIE], new UnsupportedFieldSelectionError());

    if (!fields.length) {
      return this;
    }

    this._nestService.deleteFields({
      [model]: fields
    });

    return this;
  }

  /**
   * Remove given filters from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)
   *
   * @param {string[]} filters - Filters to remove
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public deleteFilters(...filters: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.POSTGREST, DriverEnum.SPATIE], new UnsupportedFilterError());

    if (!filters.length) {
      return this;
    }

    this._nestService.deleteFilters(...filters);
    this._nestService.page = 1;

    return this;
  }

  /**
   * Remove selected related models from the query builder state (JSON:API and Spatie only)
   *
   * @param {string[]} includes - Models to remove
   * @returns {this}
   * @throws {UnsupportedIncludesError} If the active driver does not support includes
   */
  public deleteIncludes(...includes: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.SPATIE], new UnsupportedIncludesError());

    if (!includes.length) {
      return this;
    }

    this._nestService.deleteIncludes(...includes);

    return this;
  }

  /**
   * Remove operator filters by field name (NestJS and PostgREST)
   *
   * @param {string[]} fields - Field names of operator filters to remove
   * @returns {this}
   * @throws {UnsupportedFilterOperatorError} If the active driver does not support filter operators
   */
  public deleteOperatorFilters(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS, DriverEnum.POSTGREST], new UnsupportedFilterOperatorError());

    if (!fields.length) {
      return this;
    }

    this._nestService.deleteOperatorFilters(...fields);
    this._nestService.page = 1;

    return this;
  }

  /**
   * Remove search term from the query builder state (NestJS only)
   *
   * @returns {this}
   * @throws {UnsupportedSearchError} If the active driver does not support search
   */
  public deleteSearch(): this {
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedSearchError());
    this._nestService.deleteSearch();
    this._nestService.page = 1;

    return this;
  }

  /**
   * Remove flat field selections from the query builder state (NestJS and PostgREST)
   *
   * @param {string[]} fields - Fields to remove from selection
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public deleteSelect(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS, DriverEnum.POSTGREST], new UnsupportedSelectError());

    if (!fields.length) {
      return this;
    }

    this._nestService.deleteSelect(...fields);

    return this;
  }

  /**
   * Remove sort rules from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)
   *
   * @param sorts - Fields used for sorting to remove
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public deleteSorts(...sorts: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.POSTGREST, DriverEnum.SPATIE], new UnsupportedSortError());
    this._nestService.deleteSorts(...sorts);
    this._nestService.page = 1;

    return this;
  }

  /**
   * Navigate to the first page (page 1)
   *
   * @remarks Never throws. Idempotent when already on page 1.
   * @returns {this}
   */
  public firstPage(): this {
    this._nestService.page = 1;

    return this;
  }

  /**
   * Generate a URI accordingly to the given data and active driver
   *
   * @returns {Observable<string>} An observable that emits the generated URI
   */
  public generateUri(): Observable<string> {
    try {
      this._uri$.next(this._requestStrategy.buildUri(this._nestService.nest(), this._options));
      return this.uri$;
    } catch (error) {
      return throwError(() => error);
    }
  }

  /**
   * Navigate directly to the specified page
   *
   * Validates integer/positive via the existing `setPage` path, and
   * additionally rejects values that exceed `state.lastPage` when
   * pagination bounds are known.
   *
   * @param n - Target page number
   * @returns {this}
   * @throws {InvalidPageNumberError} If `n` is not a positive integer, or if `n > state.lastPage` when `state.isLastPageKnown` is true
   */
  public goToPage(n: number): this {
    const state = this._nestService.nest();

    if (state.isLastPageKnown && n > state.lastPage) {
      throw new InvalidPageNumberError(n);
    }

    this._nestService.page = n;

    return this;
  }

  /**
   * Check whether a next page exists
   *
   * @remarks Template-safe. Returns `true` when pagination bounds are unknown (conservative default — keeps a "Next" button enabled before the first `paginate()` call).
   * @returns `true` if `state.page < state.lastPage` when bounds are known, or `true` when bounds are unknown
   */
  public hasNextPage(): boolean {
    const state = this._nestService.nest();

    return !state.isLastPageKnown || state.page < state.lastPage;
  }

  /**
   * Check whether a previous page exists
   *
   * @remarks Always safe. Does not require a synced paginated response.
   * @returns `true` if `state.page > 1`
   */
  public hasPreviousPage(): boolean {
    return this._nestService.nest().page > 1;
  }

  /**
   * Check whether the current page is the first page
   *
   * @remarks Always safe. Does not require a synced paginated response.
   * @returns `true` if `state.page === 1`
   */
  public isFirstPage(): boolean {
    return this._nestService.nest().page === 1;
  }

  /**
   * Check whether the current page is the last page
   *
   * @remarks Template-safe. Returns `false` when pagination bounds are unknown (no paginated response has been synced yet) — keeps "Next" navigation unblocked until the first `paginate()` call syncs.
   * @returns `true` only when `state.isLastPageKnown` and `state.page === state.lastPage`
   */
  public isLastPage(): boolean {
    const state = this._nestService.nest();

    return state.isLastPageKnown && state.page === state.lastPage;
  }

  /**
   * Navigate to the last page known from the most recent paginated response
   *
   * @remarks Requires at least one `PaginationService.paginate()` call to have synced `state.lastPage`. Before that, the bound is unknown and this method throws.
   * @returns {this}
   * @throws {PaginationNotSyncedError} If `state.isLastPageKnown` is false (no paginated response has been synced yet)
   */
  public lastPage(): this {
    const state = this._nestService.nest();

    if (!state.isLastPageKnown) {
      throw new PaginationNotSyncedError('navigate to last page');
    }

    this._nestService.page = state.lastPage;

    return this;
  }

  /**
   * Navigate to the next page
   *
   * @remarks Never throws. Idempotent at the known last page (no-op). Pair with `hasNextPage()` for a disable-state binding.
   * @returns {this}
   */
  public nextPage(): this {
    const state = this._nestService.nest();

    if (state.isLastPageKnown && state.page >= state.lastPage) {
      return this;
    }

    this._nestService.page = state.page + 1;

    return this;
  }

  /**
   * Navigate to the previous page
   *
   * @remarks Never throws. Idempotent at page 1 (floored). Pair with `hasPreviousPage()` for a disable-state binding.
   * @returns {this}
   */
  public previousPage(): this {
    const state = this._nestService.nest();

    if (state.page <= 1) {
      return this;
    }

    this._nestService.page = state.page - 1;

    return this;
  }

  /**
   * Clear the current state and reset the Query Builder to a fresh, clean condition
   *
   * @returns {this}
   */
  public reset(): this {
    this._nestService.reset();

    return this;
  }

  /**
   * Set the base URL to use for composing the address
   *
   * @param {string} baseUrl - The base URL
   * @returns {this}
   */
  public setBaseUrl(baseUrl: string): this {
    this._nestService.baseUrl = baseUrl;

    return this;
  }

  /**
   * Set the items per page number
   *
   * Validation is delegated to the active request strategy because the
   * accepted range is driver-specific: nestjs-paginate additionally accepts
   * `-1` as a "fetch all" sentinel, while Laravel, Spatie, and JSON:API
   * require a positive integer.
   *
   * @param limit - Number of items per page (or `-1` to fetch all, NestJS only)
   * @returns {this}
   * @throws {import('../errors/invalid-limit.error').InvalidLimitError} If the value is not accepted by the active driver
   */
  public setLimit(limit: number): this {
    this._requestStrategy.validateLimit(limit);
    this._nestService.limit = limit;
    this._nestService.page = 1;

    return this;
  }

  /**
   * Set the page that the backend will use to paginate the result set
   *
   * @param page - Page number
   * @returns {this}
   */
  public setPage(page: number): this {
    this._nestService.page = page;

    return this;
  }

  /**
   * Set the API resource to run the query against
   *
   * @param {string} resource - Resource name (e.g. 'users' produces /users)
   * @returns {this}
   */
  public setResource(resource: string): this {
    this._nestService.resource = resource;
    this._nestService.page = 1;

    return this;
  }

  /**
   * Set the search term for full-text search (NestJS only)
   *
   * Produces: `search=term`
   *
   * @param {string} search - The search term
   * @returns {this}
   * @throws {UnsupportedSearchError} If the active driver does not support search
   */
  public setSearch(search: string): this {
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedSearchError());
    this._nestService.setSearch(search);
    this._nestService.page = 1;

    return this;
  }

  /**
   * Get the total number of pages reported by the most recent paginated response
   *
   * @remarks Throws when called before any `paginate()` has synced a value. For a non-throwing read in a template, read `nest().isLastPageKnown` first as a guard.
   * @returns The last page number
   * @throws {PaginationNotSyncedError} If `state.isLastPageKnown` is false (no paginated response has been synced yet)
   */
  public totalPages(): number {
    const state = this._nestService.nest();

    if (!state.isLastPageKnown) {
      throw new PaginationNotSyncedError('read totalPages');
    }

    return state.lastPage;
  }
}

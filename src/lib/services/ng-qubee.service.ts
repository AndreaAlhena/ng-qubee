import { BehaviorSubject, Observable, filter, throwError } from 'rxjs';

// Enums
import { DriverEnum } from '../enums/driver.enum';
import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';

// Errors
import { UnsupportedFieldSelectionError } from '../errors/unsupported-field-selection.error';
import { UnsupportedFilterError } from '../errors/unsupported-filter.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { UnsupportedIncludesError } from '../errors/unsupported-includes.error';
import { UnsupportedSearchError } from '../errors/unsupported-search.error';
import { UnsupportedSelectError } from '../errors/unsupported-select.error';
import { UnsupportedSortError } from '../errors/unsupported-sort.error';

// Interfaces
import { IFields } from '../interfaces/fields.interface';
import { IQueryBuilderConfig } from '../interfaces/query-builder-config.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';

// Models
import { QueryBuilderOptions } from '../models/query-builder-options';

// Services
import { NestService } from './nest.service';

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
    requestStrategy: IRequestStrategy,
    driver: DriverEnum,
    options: IQueryBuilderConfig = {}
  ) {
    this._driver = driver;
    this._options = new QueryBuilderOptions(options);
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
   * Add a filter with the given value(s) (JSON:API, NestJS, and Spatie)
   *
   * Produces: `filter[field]=value` (JSON:API / Spatie) or `filter.field=value` (NestJS)
   *
   * @param {string} field - Name of the field to filter
   * @param {(string | number | boolean)[]} values - The needle(s)
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public addFilter(field: string, ...values: (string | number | boolean)[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.SPATIE], new UnsupportedFilterError());

    if (!values.length) {
      return this;
    }

    this._nestService.addFilters({
      [field]: values
    });

    return this;
  }

  /**
   * Add a filter with an explicit operator (NestJS only)
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
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedFilterOperatorError());

    if (!values.length) {
      return this;
    }

    this._nestService.addOperatorFilters([{ field, operator, values }]);

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
   * Add flat field selection (NestJS only)
   *
   * Produces: `select=col1,col2`
   *
   * @param {string[]} fields - Fields to select
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public addSelect(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedSelectError());

    if (!fields.length) {
      return this;
    }

    this._nestService.addSelect(fields);

    return this;
  }

  /**
   * Add a field with a sort criteria (JSON:API, NestJS, and Spatie)
   *
   * @param field - Field to use for sorting
   * @param {SortEnum} order - A value from the SortEnum enumeration
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public addSort(field: string, order: SortEnum): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.SPATIE], new UnsupportedSortError());

    this._nestService.addSort({
      field,
      order
    });

    return this;
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
   * Remove given filters from the query builder state (JSON:API, NestJS, and Spatie)
   *
   * @param {string[]} filters - Filters to remove
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public deleteFilters(...filters: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.SPATIE], new UnsupportedFilterError());

    if (!filters.length) {
      return this;
    }

    this._nestService.deleteFilters(...filters);

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
   * Remove operator filters by field name (NestJS only)
   *
   * @param {string[]} fields - Field names of operator filters to remove
   * @returns {this}
   * @throws {UnsupportedFilterOperatorError} If the active driver does not support filter operators
   */
  public deleteOperatorFilters(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedFilterOperatorError());

    if (!fields.length) {
      return this;
    }

    this._nestService.deleteOperatorFilters(...fields);

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

    return this;
  }

  /**
   * Remove flat field selections from the query builder state (NestJS only)
   *
   * @param {string[]} fields - Fields to remove from selection
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public deleteSelect(...fields: string[]): this {
    this._assertDriver([DriverEnum.NESTJS], new UnsupportedSelectError());

    if (!fields.length) {
      return this;
    }

    this._nestService.deleteSelect(...fields);

    return this;
  }

  /**
   * Remove sort rules from the query builder state (JSON:API, NestJS, and Spatie)
   *
   * @param sorts - Fields used for sorting to remove
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public deleteSorts(...sorts: string[]): this {
    this._assertDriver([DriverEnum.JSON_API, DriverEnum.NESTJS, DriverEnum.SPATIE], new UnsupportedSortError());
    this._nestService.deleteSorts(...sorts);

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
   * @param limit - Number of items per page
   * @returns {this}
   */
  public setLimit(limit: number): this {
    this._nestService.limit = limit;

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

    return this;
  }
}

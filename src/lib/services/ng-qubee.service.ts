import { Inject, Injectable, Optional } from '@angular/core';
import * as qs from 'qs';
import { BehaviorSubject, Observable, filter } from 'rxjs';

// Enums
import { SortEnum } from '../enums/sort.enum';

// Errors
import { UnselectableModelError } from '../errors/unselectable-model.error';

// Interfaces
import { IFields } from '../interfaces/fields.interface';
import { IQueryBuilderConfig } from '../interfaces/query-builder-config.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';

// Models
import { QueryBuilderOptions } from '../models/query-builder-options';

// Services
import { NestService } from './nest.service';

@Injectable()
export class NgQubeeService {

  private _options: QueryBuilderOptions;

  /**
   * This property serves as an accumulator for holding the composed string with each query param
   */
  private _uri = '';

  private _uri$: BehaviorSubject<string> = new BehaviorSubject('');

  public uri$: Observable<string> = this._uri$.asObservable().pipe(
    filter(uri => !!uri)
  );

  constructor(private _nestService: NestService, @Inject('QUERY_PARAMS_CONFIG') @Optional() options: IQueryBuilderConfig = {}) {
    this._options = new QueryBuilderOptions(options);
  }

  private _parseFields(s: IQueryBuilderState): string {
    if (!Object.keys(s.fields).length) {
      return this._uri;
    }

    if (!s.model) {
      throw new Error('While selecting fields, the -> model <- is required');
    }

    if (!(s.model in s.fields)) {
      throw new Error(`Key ${s.model} is missing in the fields object`);
    }

    const f = {};

    for (const k in s.fields) {
      if (s.fields.hasOwnProperty(k)) {
        // Check if the key is the model or is declared in "includes".
        // If not, it means that has not been selected anywhere and that will cause an error on the API
        if (k !== s.model && !s.includes.includes(k)) {
          throw new UnselectableModelError(k);
        }

        Object.assign(f, { [`${this._options.fields}[${k}]`]: s.fields[k].join(',') });
      }
    }

    const param = `${this._prepend(s.model)}${qs.stringify(f, { encode: false })}`;
    this._uri += param;

    return param;
  }

  private _parseFilters(s: IQueryBuilderState): string {
    const keys = Object.keys(s.filters);

    if (!keys.length) {
      return this._uri;
    }

    const f = {
      [`${this._options.filters}`]: keys.reduce((acc, key) => {
        return Object.assign(acc, { [key]: s.filters[key].join(',') });
      }, {})
    };
    const param = `${this._prepend(s.model)}${qs.stringify(f, { encode: false })}`;

    this._uri += param;

    return param;
  }

  private _parseIncludes(s: IQueryBuilderState): string {
    if (!s.includes.length) {
      return this._uri;
    }

    const param = `${this._prepend(s.model)}${this._options.includes}=${s.includes}`;
    this._uri += param;

    return param;
  }

  private _parseLimit(s: IQueryBuilderState): string {
    const param = `${this._prepend(s.model)}${this._options.limit}=${s.limit}`;
    this._uri += param;

    return param;
  }

  private _parsePage(s: IQueryBuilderState): string {
    const param = `${this._prepend(s.model)}${this._options.page}=${s.page}`;
    this._uri += param;

    return param;
  }

  private _parseSort(s: IQueryBuilderState): string {
    let param: string = '';

    if (!s.sorts.length) {
      return param;
    }

    param = `${this._prepend(s.model)}${this._options.sort}=`;

    s.sorts.forEach((sort, idx) => {
      param += `${sort.order === SortEnum.DESC ? '-' : ''}${sort.field}`;

      if (idx < s.sorts.length - 1) {
        param += ','
      }
    });

    this._uri += param;

    return param;
  }

  private _parse(s: IQueryBuilderState): string {
    if (!s.model) {
      throw new Error('Set the model property BEFORE adding filters or calling the url() / get() methods');
    }

    // Cleanup the previously generated URI
    this._uri = '';

    this._parseIncludes(s);
    this._parseFields(s);
    this._parseFilters(s);
    this._parseLimit(s);
    this._parsePage(s);
    this._parseSort(s);

    return this._uri;
  }

  private _prepend(model: string): string {
    return this._uri ? '&' : `/${model}?`;
  }

  // private _removeArgIfEmpty(arg: string): string {
  //   const params = new URL(this._uri).searchParams;
    
  //   if (!params.get(arg)) {
  //     params.delete(arg);
  //   }
    

  // }

  /**
   * Add fields to the select statement for the given model
   * 
   * @param model Model that holds the fields
   * @param fields Fields to select
   * @returns {this}
   */
  public addFields(model: string, fields: string[]): this {
    if (!fields.length) {
      return this;
    }

    this._nestService.addFields({ [model]: fields });

    return this;
  }

  /**
   * Add a filter with the given value(s)
   *  I.e. filter[field]=1 or filter[field]=1,2,3
   * 
   * @param {string} field Name of the field to filter
   * @param {string[]} value The needle(s)
   * @returns {this}
   */
  public addFilter(field: string, ...values: (string | number | boolean)[]): this {
    if (!values.length) {
      return this;
    }

    this._nestService.addFilters({
      [field]: values
    });

    return this;
  }

  /**
   * Add related entities to include in the request
   * 
   * @param {string[]} models 
   * @returns 
   */
  public addIncludes(...models: string[]): this {
    if (!models.length) {
      return this;
    }

    this._nestService.addIncludes(models);

    return this;
  }

  /**
   * Add a field with a sort criteria
   * 
   * @param field Field to use for sorting
   * @param {SortEnum} order A value from the SortEnum enumeration
   * @returns {this}
   */
  public addSort(field: string, order: SortEnum): this {
    this._nestService.addSort({
      field,
      order
    });

    return this;
  }

  /**
   * Delete selected fields for the given models in the current query builder state
   * 
   * ```
   * ngQubeeService.deleteFields({
   *   users: ['email', 'password'],
   *   address: ['zipcode']
   * });
   * ```
   * 
   * @param {IFields} fields 
   * @returns 
   */
  public deleteFields(fields: IFields): this {
    this._nestService.deleteFields(fields);
    return this;
  }

  /**
   * Delete selected fields for the given model in the current query builder state
   * 
   * ```
   * ngQubeeService.deleteFieldsByModel('users', 'email', 'password']);
   * ```
   * 
   * @param model Model that holds the fields
   * @param {string[]} fields Fields to delete from the state
   * @returns {this}
   */
  public deleteFieldsByModel(model: string, ...fields: string[]): this {
    if (!fields.length) {
      return this;
    }

    this._nestService.deleteFields({
      [model]: fields
    });

    return this;
  }

  /**
   * Remove given filters from the query builder state
   * 
   * @param {string[]} filters Filters to remove
   * @returns {this}
   */
  public deleteFilters(...filters: string[]): this {
    if (!filters.length) {
      return this;
    }

    this._nestService.deleteFilters(...filters);

    return this;
  }

  /**
   * Remove selected related models from the query builder state
   * 
   * @param {string[]} includes Models to remove
   * @returns 
   */
  public deleteIncludes(...includes: string[]): this {
    if (!includes.length) {
      return this;
    }

    this._nestService.deleteIncludes(...includes);

    return this;
  }

  /**
   * Remove sorts rules from the query builder state
   * 
   * @param sorts Fields used for sorting to remove
   * @returns {this}
   */
  public deleteSorts(...sorts: string[]): this {
    this._nestService.deleteSorts(...sorts);
    return this;
  }

  /**
   * Generate an URI accordingly to the given data
   *
   * @returns {Observable<string>} An observable that emits the generated uri
   */
  public generateUri(): Observable<string> {
    this._uri$.next(this._parse(this._nestService.nest()));
    return this.uri$;
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
   * Set the base url to use for composing the address
   * 
   * @param {string} baseUrl 
   * @returns {this}
   */
  public setBaseUrl(baseUrl: string): this {
    this._nestService.baseUrl = baseUrl;
    return this;
  }

  /**
   * Set the items per page number
   * 
   * @param limit 
   * @returns {this}
   */
  public setLimit(limit: number): this {
    this._nestService.limit = limit;
    return this;
  }

  /**
   * Set the model to use for running the query against
   *   - I.e. the model "users" will return /users
   * 
   * @param {string} model Model name
   * @returns {this}
   */
  public setModel(model: string): this {
    this._nestService.model = model;
    return this;
  }

  /**
   * Set the page that the backend will use to paginate the result set
   * 
   * @param page Page param
   * @returns {this}
   */
  public setPage(page: number): this {
    this._nestService.page = page;
    return this;
  }
}

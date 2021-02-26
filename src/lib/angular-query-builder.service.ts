import { Inject, Injectable, Optional } from '@angular/core';
import { IFields } from './interfaces/fields.interface';
import { IQueryBuilderConfig } from './interfaces/query-builder-config.interface';
import * as qs from 'qs';
import { QueryBuilderOptions } from './models/query-builder-options';
import { IFilters } from './interfaces/filters.interface';
import { UnselectableModelError } from './errors/unselectable-model.error';
import { ISort } from './interfaces/sort.interface';
import { SortEnum } from './enums/sort.enum';

@Injectable()
export class AngularQueryBuilderService {

  private _filters: IFilters = {};

  private _options: QueryBuilderOptions;

  private _params = {};

  /**
   * This property serves as an accumulator for holding the composed string with each query param
   */
  private _uri = '';

  /**
   * Add an array of related models in the response
   *
   * @var includes Models to include in the result
   */
  public appends: string[] = [];

  public baseUrl = '';

  /**
   * Defines the fields to include in the response
   *
   * @var IFields An object should be passed, as follow:
   *   ex. {'user': ['email', 'name', 'surname'], 'address': ['street'. 'city']
   */
  public fields: IFields = {};

  public includes: string[] = [];

  /**
   * Execute the query against the given model
   * @var string The model to execute the query against
   */
  public model = '';

  /**
   * @var string Page to set in the page query param
   */
  public page = 1;

  /**
   * Sort results by the given field
   */
  public sort: ISort = {};

  /**
   * @var number Elements returned in each page (max)
   */
  public limit = 15;

  constructor(@Inject('QUERY_PARAMS_CONFIG') @Optional() options: IQueryBuilderConfig = {}) {
    this._options = new QueryBuilderOptions(options);
  }

  private _parseAppends(): string {
    if (!this.appends.length) {
      return this._uri;
    }

    const param = `${this._prepend()}${this._options.appends}=${this.appends}`;
    this._uri += param;

    return param;
  }

  private _parseFields(): string {
    if (!Object.keys(this.fields).length) {
      return this._uri;
    }

    if (!this.model) {
      throw new Error('While selecting fields, the -> model <- is a required field');
    }

    if ( !(this.model in this.fields) ) {
      throw new Error(`Key ${this.model} is missing in the fields object`);
    }

    const fields = {};

    for (const k in this.fields) {
      if (this.fields.hasOwnProperty(k)) {
        // Check if the key is the model or is declared in "includes".
        // If not, it means that has not been selected anywhere and that will cause an error on the API
        if (k !== this.model && !this.includes.includes(k)) {
          throw new UnselectableModelError(k);
        }

        Object.assign(fields, {[`${this._options.fields}[${k}]`]: this.fields[k].join(',')});
      }
    }

    // const fields = {
    //   [`${this._options.fields}[${this.model}]`]: this.fields[this.model].join(',')
    // };

    const param = `${this._prepend()}${qs.stringify(fields, {encode: false})}`;
    this._uri += param;

    return param;
  }

  private _parseFilters(): string {
    if (!Object.keys(this._filters).length) {
      return this._uri;
    }

    const filters = { [this._options.filters]: this._filters };
    const param = `${this._prepend()}${qs.stringify(filters, {encode: false})}`;
    this._uri += param;

    return param;
  }

  private _parseIncludes(): string {
    if (!this.includes.length) {
      return this._uri;
    }

    const param = `${this._prepend()}${this._options.includes}=${this.includes}`;
    this._uri += param;

    return param;
  }

  private _parseLimit(): string {
    const param = `${this._prepend()}${this._options.limit}=${this.limit}`;
    this._uri += param;

    return param;
  }

  private _parsePage(): string {
    const param = `${this._prepend()}${this._options.page}=${this.page}`;
    this._uri += param;

    return param;
  }

  /**
   * @todo Parse against multiple fields
   */
  private _parseSort(): string {
    let param: string = '';

    for (const field in this.sort) {
      param = `${this._prepend()}${this._options.sort}=${this.sort[field] === SortEnum.DESC ? '-' : ''}${field}`;
    }

    this._uri += param;

    return param;
  }

  private _parse(): string {
    if (!this.model) {
      throw new Error('Set the model property BEFORE adding filters or calling the url() / get() methods');
    }

    this._parseAppends();
    this._parseFields();
    this._parseFilters();
    this._parseIncludes();
    this._parseLimit();
    this._parsePage();
    this._parseSort();

    return this._uri;
  }

  private _prepend(): string {
    return this._uri ? '&' : `/${this.model}?`;
  }

  /**
   * Generate a URL accordingly to the given data
   *
   * @returns string
   */
  public generateUrl(model: string): string {
    // Cleanup the previously generated URI
    this._uri = '';

    // Hold the given model
    this.model = model;

    return `${this.baseUrl}${this._parse()}`;
  }

  public resetFilters(): void {
    this._filters = {};
  }

  public where(key: string, value: string): this {
    this._filters[key] = value;
    return this;
  }

  public whereIn(key: string, values: string[]): this {
    this._filters[key] = values.join(',');
    return this;
  }
}

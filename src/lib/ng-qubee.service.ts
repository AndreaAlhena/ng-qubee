import { Inject, Injectable, Optional } from '@angular/core';
import { IQueryBuilderConfig } from './interfaces/query-builder-config.interface';
import * as qs from 'qs';
import { QueryBuilderOptions } from './models/query-builder-options';
import { UnselectableModelError } from './errors/unselectable-model.error';
import { SortEnum } from './enums/sort.enum';
import { select, Store } from '@ngrx/store';
import { addFields, addFilters, addIncludes, addSorts, deleteFields, deleteFilters, deleteIncludes, deleteSorts, reset, setBaseUrl, setLimit, setModel, setPage, updateUri } from './actions/query-builder.actions';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { IQueryBuilderState } from './interfaces/query-builder-state.interface';
import { INestState } from './interfaces/nest-state.interface';
import { selectNest, selectUri } from './selectors/query-builder.selector';

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

  constructor(private _store: Store<INestState>, @Inject('QUERY_PARAMS_CONFIG') @Optional() options: IQueryBuilderConfig = {}) {
    this._options = new QueryBuilderOptions(options);
    this._store.select(selectUri).subscribe(uri => this._uri$.next(uri));
  }

  private _parseFields(s: IQueryBuilderState): string {
    if (!Object.keys(s.fields).length) {
      return this._uri;
    }

    if (!s.model) {
      throw new Error('While selecting fields, the -> model <- is required');
    }

    if ( !(s.model in s.fields) ) {
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

        Object.assign(f, {[`${this._options.fields}[${k}]`]: s.fields[k].join(',')});
      }
    }

    const param = `${this._prepend(s.model)}${qs.stringify(f, {encode: false})}`;
    this._uri += param;

    return param;
  }

  private _parseFilters(s: IQueryBuilderState): string {
    if (!Object.keys(s.filters).length) {
      return this._uri;
    }

    const f = { [this._options.filters]: s.filters };
    const param = `${this._prepend(s.model)}${qs.stringify(f, {encode: false})}`;
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
    const fields = Object.keys(s.sort);

    if (!fields.length) {
      return param;
    }

    param = `${this._prepend(s.model)}${this._options.sort}=`;

    fields.forEach((field, idx) => {
      param += `${s.sort[field] === SortEnum.DESC ? '-' : ''}${field}`;

      if (idx < fields.length - 1) {
        param += ','
      }
    });

    this._uri += param;

    return param;
  }

  private _parse(s: IQueryBuilderState): void {
    if (!s.model) {
      throw new Error('Set the model property BEFORE adding filters or calling the url() / get() methods');
    }

    this._parseIncludes(s);
    this._parseFields(s);
    this._parseFilters(s);
    this._parseIncludes(s);
    this._parseLimit(s);
    this._parsePage(s);
    this._parseSort(s);

    this._store.dispatch(updateUri({uri: this._uri}));
  }

  private _prepend(model: string): string {
    return this._uri ? '&' : `/${model}?`;
  }

  /**
   * Generate an URI accordingly to the given data
   *
   * @returns {Observable<string>} An observable that emits the generated uri
   */
  public generateUri(): Observable<string> {
    // Cleanup the previously generated URI
    this._uri = '';
    this._store.pipe(select(selectNest), take(1)).subscribe(s => this._parse(s));

    return this.uri$;
  }

  /**
   * Add fields to the select statement for the given model
   * 
   * @param model Model that holds the fields
   * @param fields Fields to select
   * @returns {this}
   */
  public addFields(model: string, fields: string[]): this {
    this._store.dispatch(addFields({
      fields: {
        [model]: fields
      }
    }));
    
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
  public addFilter(field: string, ...values: string[]): this {
    this._store.dispatch(addFilters({
      filters: {
        [field]: values.join(',')
      }
    }));

    return this;
  }

  /**
   * Add related entities to include in the request
   * 
   * @param {string[]} models 
   * @returns 
   */
  public addIncludes(...models: string[]): this {
    this._store.dispatch(addIncludes({
      includes: models
    }));

    return this;
  }

  /**
   * Add a field with a sort criteria
   * 
   * @param field Field to use for sorting
   * @param {SortEnum} value A value from the SortEnum enumeration
   * @returns {this}
   */
  public addSort(field: string, value: SortEnum): this {
    this._store.dispatch(addSorts({
      sorts: {
        [field]: value
      }
    }));

    return this;
  }

  /**
   * Delete selected fields for the given model in the current query builder state
   * 
   * @param model Model that holds the fields
   * @param {string[]} fields Fields to delete from the state
   * @returns {this}
   */
   public deleteFields(model: string, ...fields: string[]): this {
    this._store.dispatch(deleteFields({fields}));
    return this;
  }

  /**
   * Remove given filters from the query builder state
   * 
   * @param {string[]} filters Filters to remove
   * @returns {this}
   */
  public deleteFilters(...filters: string[]): this {
    this._store.dispatch(deleteFilters({filters}));
    return this;
  }

  /**
   * Remove selected related models from the query builder state
   * 
   * @param {string[]} includes Models to remove
   * @returns 
   */
  public deleteIncludes(...includes: string[]): this {
    this._store.dispatch(deleteIncludes({includes}));
    return this;
  }

  /**
   * Remove sorts rules from the query builder state
   * 
   * @param sorts Fields used for sorting to remove
   * @returns {this}
   */
  public deleteSorts(...sorts: string[]): this {
    this._store.dispatch(deleteSorts({sorts}));
    return this;
  }

  public reset(): this {
    this._store.dispatch(reset());
    return this;
  }

  /**
   * Set the base url to use for composing the address
   * 
   * @param {string} baseUrl 
   * @returns {this}
   */
  public setBaseUrl(baseUrl: string): this {
    this._store.dispatch(setBaseUrl({baseUrl}));
    return this;
  }

  /**
   * Set the items per page number
   * 
   * @param limit 
   * @returns {this}
   */
  public setLimit(limit: number): this {
    this._store.dispatch(setLimit({limit}));
    return this;
  }

  /**
   * Set the model to use for running the query against
   *   - I.e. the model "users" will return /users
   */
  public setModel(model: string): this {
    this._store.dispatch(setModel({model}));
    return this;
  }

  public setPage(page: number): this {
    this._store.dispatch(setPage({page}));
    return this;
  }
}
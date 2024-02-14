import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IFields } from '../interfaces/fields.interface';
import { IFilters } from '../interfaces/filters.interface';
import { ISort } from '../interfaces/sort.interface';

const INITIAL_STATE: IQueryBuilderState = {
  baseUrl: '',
  fields: {},
  filters: {},
  includes: [],
  limit: 15,
  model: '',
  page: 1,
  sort: {}
};

@Injectable()
export class NestService {

  /**
   * Private writable signal that holds the Query Builder state
   * 
   * @type {IQueryBuilderState>}
   */
  private _nest: WritableSignal<IQueryBuilderState> = signal(this._clone(INITIAL_STATE));

  /**
   * A computed signal that makes readonly the writable signal _nest
   * 
   * @type {Signal<IQueryBuilderState>}
   */
  public nest: Signal<IQueryBuilderState> = computed(() => this._clone(this._nest()));

  constructor() {
    // Nothing to see here 👮🏻‍♀️
  }

  set baseUrl(baseUrl: string) {
    this._nest.update(nest => ({
      ...nest,
      baseUrl
    }));
  }

  set limit(limit: number) {
    this._nest.update(nest => ({
      ...nest,
      limit
    }));
  }

  set model(model: string) {
    this._nest.update(nest => ({
      ...nest,
      model
    }));
  }

  set page(page: number) {
    this._nest.update(nest => ({
      ...nest,
      page
    }));
  }

  private _clone<T>(obj: T): T {
    return JSON.parse( JSON.stringify(obj) );
  }

  /**
   * Add selectable fields for the given model to the request
   * 
   * @param {IFields} fields 
   * @return {void}
   * @todo Avoid duplicated fields
   */
  public addFields(fields: IFields): void {
    this._nest.update(nest => ({
      ...nest,
      fields: { ...nest.fields, ...fields }
    }));
  }

  /**
   * Add filters to the request
   * 
   * @param {IFilters} filters
   * @todo Avoid duplicated filters
   */
  public addFilters(filters: IFilters): void {
    this._nest.update(nest => ({
      ...nest,
      filters: { ...nest.filters, ...filters }
    }));
  }

  /**
   * Add resources to include with the request
   * 
   * @param {string[]} includes  models to include to the request
   * @return {void}
   * @todo Avoid duplicated includes
   */
  public addIncludes(includes: string[]): void {
    this._nest.update(nest => ({
      ...nest,
      includes: [...nest.includes, ...includes]
    }))
  }

  /**
   * Add a field that should be used for sorting data
   * 
   * @param {ISort} sort
   * @return {void}
   */
  public addSort(sort: ISort): void {
    this._nest.update(nest => ({
      ...nest,
      sort
    }));
  }

  /**
   * Remove fields for the given model
   * 
   * @param {IFields} fields 
   */
  public deleteFields(fields: IFields): void {
    const f = Object.assign({}, this.nest().fields);

    Object.keys(fields).forEach(k => {
      if (!(k in f)) {
        return;
      }

      f[k] = this._nest().fields[k].filter(v => !fields[k].includes(v));
    });

    this._nest.update(nest => ({
      ...nest,
      fields: f
    }));
  }

  /**
   * 
   * @param filters 
   * @todo Create a clone of the filter obj before assigning to f
   */
  public deleteFilters(...filters: string[]): void {
    const f = Object.assign({}, this._nest().filters);
    
    filters.forEach(k => delete f[k]);

    this._nest.update(nest => ({
      ...nest,
      filters: f
    }));
  }

  /**
   * 
   * @param includes 
   */
  public deleteIncludes(...includes: string[]): void {
    this._nest.update(nest => ({
      ...nest,
      includes: nest.includes.filter(v => !includes.includes(v))
    }));
  }

  /**
   * 
   * @param sorts 
   */
  public deleteSorts(...sorts: string[]): void {
    const s = Object.assign({}, this._nest().sort);
    
    sorts.forEach(v => delete s[v]);
    
    this._nest.update(nest => ({
      ...nest,
      sort: s
    }));
  }

  public reset(): void {
    this._nest.update(_ => this._clone(INITIAL_STATE));
  }
}

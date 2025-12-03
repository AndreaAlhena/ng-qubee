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
  sorts: []
};

@Injectable()
export class NestService {

  /**
   * Private writable signal that holds the Query Builder state
   * 
   * @type {IQueryBuilderState}
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
   * Automatically prevents duplicate fields for each model
   *
   * @param {IFields} fields
   * @return {void}
   */
  public addFields(fields: IFields): void {
    this._nest.update(nest => {
      const mergedFields = { ...nest.fields };

      Object.keys(fields).forEach(model => {
        const existingFields = mergedFields[model] || [];
        const newFields = fields[model];

        // Use Set to prevent duplicates
        const uniqueFields = Array.from(new Set([...existingFields, ...newFields]));
        mergedFields[model] = uniqueFields;
      });

      return {
        ...nest,
        fields: mergedFields
      };
    });
  }

  /**
   * Add filters to the request
   * Automatically prevents duplicate filter values for each filter key
   *
   * @param {IFilters} filters
   * @return {void}
   */
  public addFilters(filters: IFilters): void {
    this._nest.update(nest => {
      const mergedFilters = { ...nest.filters };

      Object.keys(filters).forEach(key => {
        const existingValues = mergedFilters[key] || [];
        const newValues = filters[key];

        // Use Set to prevent duplicates
        const uniqueValues = Array.from(new Set([...existingValues, ...newValues]));
        mergedFilters[key] = uniqueValues;
      });

      return {
        ...nest,
        filters: mergedFilters
      };
    });
  }

  /**
   * Add resources to include with the request
   * Automatically prevents duplicate includes
   *
   * @param {string[]} includes  models to include to the request
   * @return {void}
   */
  public addIncludes(includes: string[]): void {
    this._nest.update(nest => {
      // Use Set to prevent duplicates
      const uniqueIncludes = Array.from(new Set([...nest.includes, ...includes]));

      return {
        ...nest,
        includes: uniqueIncludes
      };
    });
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
      sorts: [...nest.sorts, sort]
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
    const s = [...this._nest().sorts];
    
    sorts.forEach(field => {
      const p = this.nest().sorts.findIndex(sort => sort.field === field);

      if (p > -1) {
        s.splice(p, 1);
      }
    });
    
    this._nest.update(nest => ({
      ...nest,
      sorts: s
    }));
  }

  public reset(): void {
    this._nest.update(_ => this._clone(INITIAL_STATE));
  }
}

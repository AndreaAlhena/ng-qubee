import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IFields } from '../interfaces/fields.interface';
import { IFilters } from '../interfaces/filters.interface';
import { ISort } from '../interfaces/sort.interface';
import { InvalidModelNameError } from '../errors/invalid-model-name.error';
import { InvalidPageNumberError } from '../errors/invalid-page-number.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';

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
    this._validateLimit(limit);
    this._nest.update(nest => ({
      ...nest,
      limit
    }));
  }

  set model(model: string) {
    this._validateModelName(model);
    this._nest.update(nest => ({
      ...nest,
      model
    }));
  }

  set page(page: number) {
    this._validatePageNumber(page);
    this._nest.update(nest => ({
      ...nest,
      page
    }));
  }

  private _clone<T>(obj: T): T {
    return JSON.parse( JSON.stringify(obj) );
  }

  /**
   * Validates that the model name is a non-empty string
   *
   * @param {string} model - The model name to validate
   * @throws {InvalidModelNameError} If model is not a non-empty string
   * @private
   */
  private _validateModelName(model: string): void {
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      throw new InvalidModelNameError(model);
    }
  }

  /**
   * Validates that the page number is a positive integer
   *
   * @param {number} page - The page number to validate
   * @throws {InvalidPageNumberError} If page is not a positive integer
   * @private
   */
  private _validatePageNumber(page: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidPageNumberError(page);
    }
  }

  /**
   * Validates that the limit is a positive integer
   *
   * @param {number} limit - The limit value to validate
   * @throws {InvalidLimitError} If limit is not a positive integer
   * @private
   */
  private _validateLimit(limit: number): void {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new InvalidLimitError(limit);
    }
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
   * Uses deep cloning to prevent mutations to the original state
   *
   * @param {IFields} fields
   * @return {void}
   */
  public deleteFields(fields: IFields): void {
    // Deep clone the fields object to prevent mutations
    const f = this._clone(this._nest().fields);

    Object.keys(fields).forEach(k => {
      if (!(k in f)) {
        return;
      }

      f[k] = f[k].filter(v => !fields[k].includes(v));
    });

    this._nest.update(nest => ({
      ...nest,
      fields: f
    }));
  }

  /**
   * Remove filters from the request
   * Uses deep cloning to prevent mutations to the original state
   *
   * @param {string[]} filters - Filter keys to remove
   * @return {void}
   */
  public deleteFilters(...filters: string[]): void {
    // Deep clone the filters object to prevent mutations
    const f = this._clone(this._nest().filters);

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

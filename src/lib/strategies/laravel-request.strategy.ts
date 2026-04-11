import * as qs from 'qs';

import { SortEnum } from '../enums/sort.enum';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Request strategy for the Laravel (Spatie Query Builder) driver
 *
 * Generates URIs in the Laravel format:
 * - Fields: `fields[model]=col1,col2`
 * - Filters: `filter[field]=value`
 * - Includes: `include=model1,model2`
 * - Sorts: `sort=-field1,field2` (- prefix = DESC)
 * - Pagination: `limit=N&page=N`
 */
export class LaravelRequestStrategy implements IRequestStrategy {

  /**
   * Accumulator for composing the URI string
   */
  private _uri = '';

  /**
   * Build a URI string from the given state using the Laravel format
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if model is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.model) {
      throw new Error('Set the model property BEFORE adding filters or calling the url() / get() methods');
    }

    this._uri = '';

    this._parseIncludes(state, options);
    this._parseFields(state, options);
    this._parseFilters(state, options);
    this._parseLimit(state, options);
    this._parsePage(state, options);
    this._parseSort(state, options);

    return this._uri;
  }

  /**
   * Parse and append field selection parameters
   *
   * Validates that each field model exists either as the main model
   * or in the includes list. Fields are grouped by model in bracket notation.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated field selection parameter string
   * @throws Error if model is required but not set
   * @throws UnselectableModelError if a field model is not in model or includes
   */
  private _parseFields(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!Object.keys(state.fields).length) {
      return this._uri;
    }

    if (!state.model) {
      throw new Error('While selecting fields, the -> model <- is required');
    }

    if (!(state.model in state.fields)) {
      throw new Error(`Key ${state.model} is missing in the fields object`);
    }

    const f: Record<string, string> = {};

    for (const k in state.fields) {
      if (state.fields.hasOwnProperty(k)) {
        if (k !== state.model && !state.includes.includes(k)) {
          throw new UnselectableModelError(k);
        }

        Object.assign(f, { [`${options.fields}[${k}]`]: state.fields[k].join(',') });
      }
    }

    const param = `${this._prepend(state)}${qs.stringify(f, { encode: false })}`;
    this._uri += param;

    return param;
  }

  /**
   * Parse and append filter parameters
   *
   * Generates filter parameters in bracket notation: `filter[key]=value1,value2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated filter parameter string
   */
  private _parseFilters(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return this._uri;
    }

    const f = {
      [`${options.filters}`]: keys.reduce((acc: Record<string, string>, key: string) => {
        return Object.assign(acc, { [key]: state.filters[key].join(',') });
      }, {})
    };
    const param = `${this._prepend(state)}${qs.stringify(f, { encode: false })}`;

    this._uri += param;

    return param;
  }

  /**
   * Parse and append include parameters
   *
   * Generates: `include=model1,model2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated include parameter string
   */
  private _parseIncludes(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.includes.length) {
      return this._uri;
    }

    const param = `${this._prepend(state)}${options.includes}=${state.includes}`;
    this._uri += param;

    return param;
  }

  /**
   * Parse and append the limit parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated limit parameter string
   */
  private _parseLimit(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    const param = `${this._prepend(state)}${options.limit}=${state.limit}`;
    this._uri += param;

    return param;
  }

  /**
   * Parse and append the page parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated page parameter string
   */
  private _parsePage(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    const param = `${this._prepend(state)}${options.page}=${state.page}`;
    this._uri += param;

    return param;
  }

  /**
   * Parse and append sort parameters
   *
   * Generates: `sort=-field1,field2` where `-` prefix indicates DESC order
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated sort parameter string
   */
  private _parseSort(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    let param = '';

    if (!state.sorts.length) {
      return param;
    }

    param = `${this._prepend(state)}${options.sort}=`;

    state.sorts.forEach((sort, idx) => {
      param += `${sort.order === SortEnum.DESC ? '-' : ''}${sort.field}`;

      if (idx < state.sorts.length - 1) {
        param += ',';
      }
    });

    this._uri += param;

    return param;
  }

  /**
   * Determine the appropriate URI prefix based on the current accumulator state
   *
   * Returns the full base path with `?` for the first parameter,
   * or `&` for subsequent parameters.
   *
   * @param state - The current query builder state
   * @returns The prefix string to prepend to the next parameter
   */
  private _prepend(state: IQueryBuilderState): string {
    if (this._uri) {
      return '&';
    }

    return state.baseUrl ? `${state.baseUrl}/${state.model}?` : `/${state.model}?`;
  }
}

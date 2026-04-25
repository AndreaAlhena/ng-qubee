import * as qs from 'qs';

import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Request strategy for the JSON:API driver
 *
 * Generates URIs in the JSON:API format:
 * - Fields: `fields[articles]=title,body&fields[people]=name`
 * - Filters: `filter[status]=active`
 * - Includes: `include=author,comments.author`
 * - Pagination: `page[number]=1&page[size]=15`
 * - Sort: `sort=-created_at,name` (- prefix = DESC)
 *
 * @see https://jsonapi.org/format/
 */
export class JsonApiRequestStrategy implements IRequestStrategy {

  /**
   * Filters, sorts, includes, per-model fields — same shape as Spatie
   * but with bracket-style pagination
   */
  public readonly capabilities: IStrategyCapabilities = {
    fields: true,
    filters: true,
    includes: true,
    operatorFilters: false,
    search: false,
    select: false,
    sort: true
  };

  /**
   * Accumulator for composing the URI string
   */
  private _uri = '';

  /**
   * Build a URI string from the given state using the JSON:API format
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if resource is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!state.resource) {
      throw new Error('Set the resource property BEFORE adding filters or calling the url() / get() methods');
    }

    this._uri = '';

    this._parseIncludes(state, options);
    this._parseFields(state, options);
    this._parseFilters(state, options);
    this._parsePagination(state, options);
    this._parseSort(state, options);

    return this._uri;
  }

  /**
   * Validate that the given limit is accepted by the JSON:API driver
   *
   * The JSON:API specification leaves pagination semantics to the server and
   * does not define a "fetch all" sentinel, so only positive integers are
   * accepted.
   *
   * @param limit - The limit value to validate
   * @throws {InvalidLimitError} If the value is not a positive integer
   */
  public validateLimit(limit: number): void {
    if (Number.isInteger(limit) && limit >= 1) {
      return;
    }

    throw new InvalidLimitError(limit);
  }

  /**
   * Parse and append field selection parameters
   *
   * Validates that each field model exists either as the main resource
   * or in the includes list. Fields are grouped by type in bracket notation.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated field selection parameter string
   * @throws Error if resource is required but not set
   * @throws UnselectableModelError if a field model is not in resource or includes
   */
  private _parseFields(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    if (!Object.keys(state.fields).length) {
      return this._uri;
    }

    if (!state.resource) {
      throw new Error('While selecting fields, the -> resource <- is required');
    }

    if (!(state.resource in state.fields)) {
      throw new Error(`Key ${state.resource} is missing in the fields object`);
    }

    const f: Record<string, string> = {};

    for (const k in state.fields) {
      if (state.fields.hasOwnProperty(k)) {
        if (k !== state.resource && !state.includes.includes(k)) {
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
   * Generates: `include=author,comments.author`
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
   * Parse and append pagination parameters in JSON:API bracket notation
   *
   * Generates: `page[number]=1&page[size]=15`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The generated pagination parameter string
   */
  private _parsePagination(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    const pagination = qs.stringify(
      { [options.page]: { number: state.page, size: state.limit } },
      { encode: false }
    );
    const param = `${this._prepend(state)}${pagination}`;

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

    return state.baseUrl ? `${state.baseUrl}/${state.resource}?` : `/${state.resource}?`;
  }
}

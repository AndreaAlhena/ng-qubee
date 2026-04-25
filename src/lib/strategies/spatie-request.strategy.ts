import * as qs from 'qs';

import { SortEnum } from '../enums/sort.enum';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Request strategy for the Spatie Query Builder driver
 *
 * Generates URIs in the Spatie format:
 * - Fields: `fields[model]=col1,col2`
 * - Filters: `filter[field]=value`
 * - Includes: `include=model1,model2`
 * - Sorts: `sort=-field1,field2` (- prefix = DESC)
 * - Pagination: `limit=N&page=N`
 *
 * @see https://spatie.be/docs/laravel-query-builder
 */
export class SpatieRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, sorts, includes, per-model fields — no operators, no flat
   * select, no global search
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
   * Emit Spatie-format query-string segments in canonical order:
   * include → fields → filters → limit → page → sort
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendIncludes(state, options, out);
    this._appendFields(state, options, out);
    this._appendFilters(state, options, out);
    this._appendLimit(state, options, out);
    this._appendPage(state, options, out);
    this._appendSort(state, options, out);

    return out;
  }

  /**
   * Append per-model field selection in bracket notation
   *
   * Validates that each field model exists either as the main resource
   * or in the includes list.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   * @throws Error if the resource is required but not set
   * @throws UnselectableModelError if a field model is not in resource or includes
   */
  private _appendFields(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!Object.keys(state.fields).length) {
      return;
    }

    if (!(state.resource in state.fields)) {
      throw new Error(`Key ${state.resource} is missing in the fields object`);
    }

    const grouped: Record<string, string> = {};

    for (const model in state.fields) {
      if (!state.fields.hasOwnProperty(model)) {
        continue;
      }

      if (model !== state.resource && !state.includes.includes(model)) {
        throw new UnselectableModelError(model);
      }

      grouped[`${options.fields}[${model}]`] = state.fields[model].join(',');
    }

    out.push(qs.stringify(grouped, { encode: false }));
  }

  /**
   * Append filter parameters in bracket notation: `filter[key]=value`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return;
    }

    const wrapper = {
      [options.filters]: keys.reduce((acc: Record<string, string>, key: string) => {
        return Object.assign(acc, { [key]: state.filters[key].join(',') });
      }, {})
    };

    out.push(qs.stringify(wrapper, { encode: false }));
  }

  /**
   * Append include parameter as `include=model1,model2`
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendIncludes(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.includes.length) {
      return;
    }

    out.push(`${options.includes}=${state.includes}`);
  }

  /**
   * Append the limit parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendLimit(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.limit}=${state.limit}`);
  }

  /**
   * Append the page parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPage(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.page}=${state.page}`);
  }

  /**
   * Append sort parameter as `sort=-field1,field2` (`-` prefix = DESC)
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.order === SortEnum.DESC ? '-' : ''}${sort.field}`
    );

    out.push(`${options.sort}=${pairs.join(',')}`);
  }
}

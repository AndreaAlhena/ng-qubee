import * as qs from 'qs';

import { SortEnum } from '../enums/sort.enum';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

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
export class JsonApiRequestStrategy extends AbstractRequestStrategy {

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
   * Emit JSON:API-format query-string segments in canonical order:
   * include → fields → filters → pagination → sort
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
    this._appendPagination(state, options, out);
    this._appendSort(state, options, out);

    return out;
  }

  /**
   * Append per-type field selection in bracket notation
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   * @throws Error if the resource is missing from the fields object
   * @throws UnselectableModelError if a field type is not the resource or in includes
   */
  private _appendFields(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!Object.keys(state.fields).length) {
      return;
    }

    if (!(state.resource in state.fields)) {
      throw new Error(`Key ${state.resource} is missing in the fields object`);
    }

    const grouped: Record<string, string> = {};

    for (const type in state.fields) {
      if (!state.fields.hasOwnProperty(type)) {
        continue;
      }

      if (type !== state.resource && !state.includes.includes(type)) {
        throw new UnselectableModelError(type);
      }

      grouped[`${options.fields}[${type}]`] = state.fields[type].join(',');
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
   * Append include parameter as `include=author,comments.author`
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
   * Append JSON:API bracket pagination as `page[number]=1&page[size]=15`
   *
   * `qs.stringify` already returns the two segments joined with `&`, so we
   * push the whole string as one accumulator entry — `_join` will glue
   * it onto the rest with the same separator.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    const pagination = qs.stringify(
      { [options.page]: { number: state.page, size: state.limit } },
      { encode: false }
    );

    out.push(pagination);
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

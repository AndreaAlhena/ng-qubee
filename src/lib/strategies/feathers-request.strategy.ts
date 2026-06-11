import * as qs from 'qs';

import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IOperatorFilter } from '../interfaces/operator-filter.interface';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Right-hand-side payload of a Feathers `field[$operator]` entry
 *
 * Each `$operator` key maps to either a primitive (single-value operators
 * like `$gt`, `$ne`) or an array (multi-value operators like `$in`,
 * `$nin`).
 */
type FeathersFilterValue = string | number | boolean;
type FeathersFilterPayload = Record<string, FeathersFilterValue | FeathersFilterValue[]>;

/**
 * Request strategy for the FeathersJS driver
 *
 * Generates URIs in [Feathers' common database adapter query syntax](https://feathersjs.com/api/databases/querying):
 * - Filters: `field=value` (exact match); multi-value folds to `$in`
 *   (`field[$in][0]=v1&field[$in][1]=v2`)
 * - Operator filters: `field[$op]=value` (translated from
 *   `FilterOperatorEnum` — `BTW`→`$gte`+`$lte` pair, `NOT`→`$ne`/`$nin`)
 * - Sorts: `$sort[field]=1` (ASC) / `$sort[field]=-1` (DESC)
 * - Flat field selection: `$select[0]=col1&$select[1]=col2`
 * - Pagination (offset-based): `$limit=N&$skip=M` with
 *   `skip = (page - 1) × limit`
 *
 * The dollar-prefixed query keys (`$limit`, `$skip`, `$sort`, `$select`)
 * are fixed by the Feathers adapter-commons parser and intentionally not
 * configurable through `QueryBuilderOptions`; they live as private
 * statics so they are visible in one place.
 *
 * Feathers' core adapter syntax has no relation includes, no per-model
 * field selection, and no global search — the corresponding fluent
 * methods throw the matching `Unsupported*Error`. `CONTAINS` / `ILIKE` /
 * `SW` (LIKE-style matching is adapter-specific, not core), `NULL` (no
 * null-check operator on the wire), and the PostgREST-native full-text
 * operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://feathersjs.com/api/databases/querying
 */
export class FeathersRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, flat field selection (`select`) —
   * no per-model fields, no includes, no global search, no embedded
   * resources
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: false,
    operatorFilters: true,
    search: false,
    select: true,
    sort: true
  };

  /**
   * Feathers-native names of the four hardcoded query keys
   *
   * The dollar prefix marks adapter-commons system params apart from
   * filter fields; these keys are fixed by the server and intentionally
   * not configurable through `QueryBuilderOptions`.
   */
  private static readonly _limitKey = '$limit';
  private static readonly _selectKey = '$select';
  private static readonly _skipKey = '$skip';
  private static readonly _sortKey = '$sort';

  /**
   * Emit Feathers-format query-string segments in canonical order:
   * filters → operator filters → $sort → $select → $limit → $skip
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * Feathers' system keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendOperatorFilters(state, out);
    this._appendSort(state, out);
    this._appendSelect(state, out);
    this._appendPagination(state, out);

    return out;
  }

  /**
   * Append simple filter parameters
   *
   * A single value emits the bare exact-match form (`field=value`);
   * multiple values fold to the `$in` list
   * (`field[$in][0]=v1&field[$in][1]=v2`).
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, out: string[]): void {
    Object.keys(state.filters).forEach(field => {
      const values = state.filters[field];

      if (!values.length) {
        return;
      }

      out.push(values.length === 1
        ? `${field}=${values[0]}`
        : qs.stringify({ [field]: { $in: values } }, { encode: false }));
    });
  }

  /**
   * Append explicit operator filters in the `field[$op]=value` syntax
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOperatorFilters(state: IQueryBuilderState, out: string[]): void {
    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      const payload = this._formatOperatorPayload(filter);

      out.push(typeof payload === 'object'
        ? qs.stringify({ [filter.field]: payload }, { encode: false })
        : `${filter.field}=${payload}`);
    });
  }

  /**
   * Append the `$limit` / `$skip` pagination pair
   *
   * Feathers paginates by offset, so the 1-based page number from state
   * converts to `skip = (page - 1) × limit`.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, out: string[]): void {
    out.push(`${FeathersRequestStrategy._limitKey}=${state.limit}`);
    out.push(`${FeathersRequestStrategy._skipKey}=${(state.page - 1) * state.limit}`);
  }

  /**
   * Append the `$select[0]=col1&$select[1]=col2` array from the flat
   * select state
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSelect(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(qs.stringify({ [FeathersRequestStrategy._selectKey]: state.select }, { encode: false }));
  }

  /**
   * Append the `$sort[field]=1|-1` map
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const map: Record<string, number> = {};

    state.sorts.forEach(sort => {
      map[sort.field] = sort.order === SortEnum.DESC ? -1 : 1;
    });

    out.push(qs.stringify({ [FeathersRequestStrategy._sortKey]: map }, { encode: false }));
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into Feathers'
   * `$operator → value` payload shape (or a bare primitive for `EQ`)
   *
   * The mapping is library-canonical → Feathers-native:
   * - `EQ` → bare `field=value` (no operator wrapper)
   * - `GT`/`GTE`/`LT`/`LTE` → `$gt` / `$gte` / `$lt` / `$lte`
   * - `IN` → `$in` (array)
   * - `BTW` → `$gte` + `$lte` pair in one payload (arity-checked)
   * - `NOT` → `$ne` (single value) / `$nin` (multi-value)
   *
   * `CONTAINS`, `ILIKE`, and `SW` (LIKE-style matching is
   * adapter-specific in Feathers, not part of the common syntax),
   * `NULL` (no null-check operator), and PostgREST's full-text-search
   * operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns A `{ $operator: value }` payload ready to nest under
   * `field[...]`, or a bare primitive for `EQ`
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values
   * @throws {UnsupportedFilterOperatorError} If the operator has no
   * Feathers equivalent
   */
  private _formatOperatorPayload(filter: IOperatorFilter): FeathersFilterPayload | FeathersFilterValue {
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return first;
      case FilterOperatorEnum.GT: return { $gt: first };
      case FilterOperatorEnum.GTE: return { $gte: first };
      case FilterOperatorEnum.LT: return { $lt: first };
      case FilterOperatorEnum.LTE: return { $lte: first };
      case FilterOperatorEnum.IN: return { $in: values };

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return { $gte: values[0], $lte: values[1] };
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? { $ne: first }
          : { $nin: values };

      case FilterOperatorEnum.CONTAINS:
      case FilterOperatorEnum.ILIKE:
      case FilterOperatorEnum.SW:
      case FilterOperatorEnum.NULL:
      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

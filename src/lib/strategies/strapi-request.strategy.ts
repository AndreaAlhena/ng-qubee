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
 * Right-hand-side payload of a Strapi `filters[field]` entry
 *
 * Each `$operator` key maps to either a primitive (single-value operators
 * like `$eq`, `$gt`) or an array (multi-value operators like `$in`,
 * `$between`). Booleans appear specifically with `$null` / `$notNull`.
 */
type StrapiFilterValue = string | number | boolean;
type StrapiFilterPayload = Record<string, StrapiFilterValue | StrapiFilterValue[]>;

/**
 * Request strategy for the Strapi driver
 *
 * Generates URIs in [Strapi's filter API format](https://docs.strapi.io/dev-docs/api/rest/filters-locale-publication):
 * - Filters: `filters[field][$eq]=value` (multi-value collapses to `$in`)
 * - Operator filters: `filters[field][$op]=value` (translated from
 *   `FilterOperatorEnum` — `BTW`→`$between`, `SW`→`$startsWith`,
 *   `ILIKE`→`$containsi`, `NOT`→`$ne`/`$notIn`,
 *   `NULL`→`$null`/`$notNull`)
 * - Sorts: `sort[0]=field:asc&sort[1]=field:desc`
 * - Field selection (flat): `fields[0]=col1&fields[1]=col2`
 * - Population: `populate[0]=relation`
 * - Pagination (page-based): `pagination[page]=N&pagination[pageSize]=N`
 *
 * Strapi-native full-text search (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) is
 * PostgREST-only and throws `UnsupportedFilterOperatorError` here.
 *
 * @see https://docs.strapi.io/dev-docs/api/rest/filters-locale-publication
 */
export class StrapiRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, populate (`includes`), flat field
   * selection (`select`) — no per-model fields, no global search (use
   * `$contains` / `$containsi` operator filters instead)
   */
  public readonly capabilities: IStrategyCapabilities = {
    fields: false,
    filters: true,
    includes: true,
    operatorFilters: true,
    search: false,
    select: true,
    sort: true
  };

  /**
   * Strapi-native names of the four hardcoded query keys
   *
   * Strapi's wire format is fixed (the server reads `pagination[page]`,
   * `populate`, `sort`, `fields`); these keys are intentionally not
   * configurable through `QueryBuilderOptions` and live as private
   * statics so they are visible in one place.
   */
  private static readonly _fieldsKey = 'fields';
  private static readonly _paginationKey = 'pagination';
  private static readonly _populateKey = 'populate';
  private static readonly _sortKey = 'sort';

  /**
   * Emit Strapi-format query-string segments in canonical order:
   * populate → fields → filters (merged) → sort → pagination
   *
   * Simple filters and operator filters share a single `filters` wrapper
   * so qs emits one ordered, deeply-nested bracket structure rather than
   * two duplicate top-level `filters[...]` blocks.
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * Strapi's wire keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendPopulate(state, out);
    this._appendFields(state, out);
    this._appendFilters(state, out);
    this._appendSort(state, out);
    this._appendPagination(state, out);

    return out;
  }

  /**
   * Append `fields[0]=col1&fields[1]=col2` from the flat select array
   *
   * Strapi's `fields` parameter is the column-pruner for the main
   * resource; per-relation field selection is expressed through the
   * `populate` deep syntax (out of scope for this driver).
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFields(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(qs.stringify({ [StrapiRequestStrategy._fieldsKey]: state.select }, { encode: false }));
  }

  /**
   * Append the unified `filters[...]` wrapper combining simple filters
   * and operator filters
   *
   * Both kinds emit into the same nested object under `filters` so qs
   * produces a single deeply-bracketed block per request. Simple
   * single-value filters fold to `$eq`; simple multi-value filters fold
   * to `$in`. Operator filters then merge into the same per-field map,
   * potentially co-existing with a simple filter on the same field.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, out: string[]): void {
    const simpleKeys = Object.keys(state.filters);

    if (!simpleKeys.length && !state.operatorFilters.length) {
      return;
    }

    const filters: Record<string, StrapiFilterPayload> = {};

    simpleKeys.forEach(key => {
      const values = state.filters[key];

      if (!values.length) {
        return;
      }

      filters[key] = values.length === 1
        ? { $eq: values[0] }
        : { $in: values };
    });

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      const payload = this._formatOperatorPayload(filter);

      filters[filter.field] = {
        ...(filters[filter.field] ?? {}),
        ...payload
      };
    });

    if (!Object.keys(filters).length) {
      return;
    }

    out.push(qs.stringify({ filters }, { encode: false }));
  }

  /**
   * Append the `pagination[page]` / `pagination[pageSize]` wrapper
   *
   * Page-based mode is the Strapi default; offset-based
   * (`pagination[start]` / `pagination[limit]`) is out of scope for this
   * driver until cursor/offset pagination lands library-wide.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, out: string[]): void {
    const wrapper = {
      [StrapiRequestStrategy._paginationKey]: {
        page: state.page,
        pageSize: state.limit
      }
    };

    out.push(qs.stringify(wrapper, { encode: false }));
  }

  /**
   * Append the `populate` parameter from the includes array
   *
   * Emits `populate[0]=relation1&populate[1]=relation2`; deep-populate
   * syntax (`populate[author][fields][0]=name`) is not exposed through
   * the current state shape.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPopulate(state: IQueryBuilderState, out: string[]): void {
    if (!state.includes.length) {
      return;
    }

    out.push(qs.stringify({ [StrapiRequestStrategy._populateKey]: state.includes }, { encode: false }));
  }

  /**
   * Append the `sort[N]=field:dir` array
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.field}:${sort.order === SortEnum.DESC ? 'desc' : 'asc'}`
    );

    out.push(qs.stringify({ [StrapiRequestStrategy._sortKey]: pairs }, { encode: false }));
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into Strapi's
   * `$operator → value` payload shape
   *
   * The mapping is library-canonical → Strapi-native:
   * - `EQ`/`GT`/`GTE`/`LT`/`LTE`/`CONTAINS` → identity (same key name)
   * - `ILIKE` → `$containsi` (case-insensitive contains)
   * - `IN` → `$in` (array)
   * - `SW` → `$startsWith`
   * - `BTW` → `$between` with `[min, max]` (arity-checked)
   * - `NOT` → `$ne` (single value) / `$notIn` (multi-value)
   * - `NULL` → `$null=true` (when value is `true`) / `$notNull=true`
   *   (when value is `false`); arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no Strapi equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns A `{ $operator: value }` payload ready to merge under
   * `filters[field]`
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorPayload(filter: IOperatorFilter): StrapiFilterPayload {
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return { $eq: first };
      case FilterOperatorEnum.GT: return { $gt: first };
      case FilterOperatorEnum.GTE: return { $gte: first };
      case FilterOperatorEnum.LT: return { $lt: first };
      case FilterOperatorEnum.LTE: return { $lte: first };
      case FilterOperatorEnum.CONTAINS: return { $contains: first };
      case FilterOperatorEnum.ILIKE: return { $containsi: first };
      case FilterOperatorEnum.IN: return { $in: values };
      case FilterOperatorEnum.SW: return { $startsWith: first };

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return { $between: values };
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? { $ne: first }
          : { $notIn: values };

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? { $null: true } : { $notNull: true };
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

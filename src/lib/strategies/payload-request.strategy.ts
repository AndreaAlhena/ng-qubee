/* eslint-disable @typescript-eslint/naming-convention -- Payload's wire-format
   operator names (greater_than, greater_than_equal, less_than, less_than_equal,
   not_equals, not_in) are snake_case by server spec and emitted verbatim */
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
 * Right-hand-side payload of a Payload `where[field]` entry
 *
 * Each operator key maps to a primitive (single-value operators like
 * `equals`, `greater_than`) or a CSV string (multi-value operators like
 * `in`, `not_in`). Booleans appear specifically with `exists`.
 */
type PayloadFilterValue = string | number | boolean;
type PayloadFilterPayload = Record<string, PayloadFilterValue>;

/**
 * Request strategy for the Payload CMS driver
 *
 * Generates URIs in [Payload's REST query format](https://payloadcms.com/docs/queries/overview):
 * - Filters: `where[field][equals]=value` (multi-value collapses to
 *   `where[field][in]=v1,v2` CSV)
 * - Operator filters: `where[field][op]=value` (translated from
 *   `FilterOperatorEnum` — `BTW`→`greater_than_equal`+`less_than_equal`
 *   pair, `NOT`→`not_equals`/`not_in`, `NULL`→`exists` with inverted
 *   boolean)
 * - Sorts: `sort=-createdAt,title` (CSV, `-` prefix = DESC)
 * - Field selection (flat): `select[col1]=true&select[col2]=true`
 * - Pagination (page-based): `page=N&limit=M`
 *
 * The `where` / `sort` / `select` / `page` / `limit` keys are fixed by
 * Payload's REST endpoints and intentionally not configurable through
 * `QueryBuilderOptions`; they live as private statics so they are
 * visible in one place.
 *
 * Relationship population is controlled by Payload's numeric `depth`
 * param, not a named-relation list — `addIncludes` therefore throws
 * `UnsupportedIncludesError` (pass `depth` through your HTTP layer if
 * needed). There is no per-model field selection and no global search
 * param. `SW` (no starts-with operator) and the PostgREST-native
 * full-text operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://payloadcms.com/docs/queries/overview
 */
export class PayloadRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, flat field selection (`select`)
   * — no per-model fields, no includes (numeric `depth` instead), no
   * global search, no embedded resources
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
   * Payload-native names of the five hardcoded query keys
   *
   * Fixed by the REST endpoints and intentionally not configurable
   * through `QueryBuilderOptions`.
   */
  private static readonly _limitKey = 'limit';
  private static readonly _pageKey = 'page';
  private static readonly _selectKey = 'select';
  private static readonly _sortKey = 'sort';
  private static readonly _whereKey = 'where';

  /**
   * Emit Payload-format query-string segments in canonical order:
   * where (merged) → sort → select → page → limit
   *
   * Simple filters and operator filters share a single `where` wrapper
   * so qs emits one ordered bracket structure rather than two duplicate
   * top-level `where[...]` blocks.
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * Payload's wire keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendWhere(state, out);
    this._appendSort(state, out);
    this._appendSelect(state, out);
    this._appendPagination(state, out);

    return out;
  }

  /**
   * Append the `page=` / `limit=` pagination pair
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, out: string[]): void {
    out.push(`${PayloadRequestStrategy._pageKey}=${state.page}`);
    out.push(`${PayloadRequestStrategy._limitKey}=${state.limit}`);
  }

  /**
   * Append `select[col]=true` flags from the flat select array
   *
   * Payload's select API is an object of `true` flags rather than a
   * CSV; nested selection (`select[group.field]=true`) passes through
   * when given as a dotted column name.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSelect(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    const flags: Record<string, boolean> = {};

    state.select.forEach(column => {
      flags[column] = true;
    });

    out.push(qs.stringify({ [PayloadRequestStrategy._selectKey]: flags }, { encode: false }));
  }

  /**
   * Append the `sort=-createdAt,title` CSV parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const fields = state.sorts.map(sort =>
      sort.order === SortEnum.DESC ? `-${sort.field}` : sort.field
    );

    out.push(`${PayloadRequestStrategy._sortKey}=${fields.join(',')}`);
  }

  /**
   * Append the unified `where[...]` wrapper combining simple filters
   * and operator filters
   *
   * Both kinds emit into the same nested object under `where` so qs
   * produces a single bracketed block per request. Simple single-value
   * filters fold to `equals`; simple multi-value filters fold to the
   * `in` CSV. Operator filters then merge into the same per-field map,
   * potentially co-existing with a simple filter on the same field.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendWhere(state: IQueryBuilderState, out: string[]): void {
    const simpleKeys = Object.keys(state.filters);

    if (!simpleKeys.length && !state.operatorFilters.length) {
      return;
    }

    const where: Record<string, PayloadFilterPayload> = {};

    simpleKeys.forEach(key => {
      const values = state.filters[key];

      if (!values.length) {
        return;
      }

      where[key] = values.length === 1
        ? { equals: values[0] }
        : { in: values.join(',') };
    });

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      const payload = this._formatOperatorPayload(filter);

      where[filter.field] = {
        ...(where[filter.field] ?? {}),
        ...payload
      };
    });

    if (!Object.keys(where).length) {
      return;
    }

    out.push(qs.stringify({ [PayloadRequestStrategy._whereKey]: where }, { encode: false }));
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into Payload's
   * `operator → value` payload shape
   *
   * The mapping is library-canonical → Payload-native:
   * - `EQ` → `equals`
   * - `GT`/`GTE`/`LT`/`LTE` → `greater_than` / `greater_than_equal` /
   *   `less_than` / `less_than_equal`
   * - `CONTAINS` → `contains` (case-insensitive substring)
   * - `ILIKE` → `like` (case-insensitive, word-based)
   * - `IN` → `in` (CSV)
   * - `BTW` → `greater_than_equal` + `less_than_equal` pair in one
   *   payload (arity-checked)
   * - `NOT` → `not_equals` (single value) / `not_in` (multi-value, CSV)
   * - `NULL` → `exists` with **inverted** boolean (`true` →
   *   `exists=false` ⇔ IS NULL); arity- and type-checked
   *
   * `SW` (Payload has no starts-with operator) and PostgREST's
   * full-text-search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns An `{ operator: value }` payload ready to merge under
   * `where[field]`
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator has no
   * Payload equivalent
   */
  private _formatOperatorPayload(filter: IOperatorFilter): PayloadFilterPayload {
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return { equals: first };
      case FilterOperatorEnum.GT: return { greater_than: first };
      case FilterOperatorEnum.GTE: return { greater_than_equal: first };
      case FilterOperatorEnum.LT: return { less_than: first };
      case FilterOperatorEnum.LTE: return { less_than_equal: first };
      case FilterOperatorEnum.CONTAINS: return { contains: first };
      case FilterOperatorEnum.ILIKE: return { like: first };
      case FilterOperatorEnum.IN: return { in: values.join(',') };

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return { greater_than_equal: values[0], less_than_equal: values[1] };
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? { not_equals: first }
          : { not_in: values.join(',') };

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        // Payload semantics: exists=false matches null/missing values
        return { exists: !first };
      }

      case FilterOperatorEnum.SW:
      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

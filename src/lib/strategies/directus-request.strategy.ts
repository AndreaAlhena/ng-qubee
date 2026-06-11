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
 * Right-hand-side payload of a Directus `filter[field]` entry
 *
 * Each `_operator` key maps to a primitive; multi-value operators
 * (`_in`, `_nin`, `_between`) carry their values pre-joined as a CSV
 * string, which is the form Directus parses from the query string.
 * Booleans appear specifically with `_null` / `_nnull`.
 */
type DirectusFilterValue = string | number | boolean;
type DirectusFilterPayload = Record<string, DirectusFilterValue>;

/**
 * Request strategy for the Directus driver
 *
 * Generates URIs in [Directus' query format](https://docs.directus.io/reference/query.html):
 * - Filters: `filter[field][_eq]=value` (multi-value collapses to `_in`)
 * - Operator filters: `filter[field][_op]=value` (translated from
 *   `FilterOperatorEnum` — `BTW`→`_between`, `SW`→`_starts_with`,
 *   `ILIKE`→`_icontains`, `NOT`→`_neq`/`_nin`, `NULL`→`_null`/`_nnull`)
 * - Sorts: `sort=-created_at,name` (CSV, `-` prefix = DESC)
 * - Field selection / relations: a single `fields=` CSV — flat columns
 *   from `addSelect`, whole relations from `addIncludes` (`rel.*`), and
 *   column-projected relations from `addEmbedded` (`rel.col1,rel.col2`)
 * - Search: `search=term` (global full-text search)
 * - Metadata: a constant `meta=total_count,filter_count` so responses
 *   carry the totals the response strategy needs
 * - Pagination (page-based): `limit=N&page=N`
 *
 * The `filter` / `sort` / `fields` / `search` / `limit` / `page` keys
 * honour the existing `QueryBuilderOptions` names (their defaults match
 * the Directus wire format); `meta` is fixed by the server and lives as
 * a private static. Directus' `deep[...]` relational query options and
 * nested relation filtering are out of scope.
 *
 * PostgREST-native full-text search operators (`FTS`, `PHFTS`, `PLFTS`,
 * `WFTS`) throw `UnsupportedFilterOperatorError` — use `search` or the
 * `CONTAINS` / `ILIKE` operator filters instead.
 *
 * @see https://docs.directus.io/reference/query.html
 * @see https://docs.directus.io/reference/filter-rules.html
 */
export class DirectusRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, flat select, includes and embedded
   * (both folding into `fields=`), global search — no per-model fields
   * (Directus scopes relational projections with dot paths, not a
   * `fields[model]` map)
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: true,
    fields: false,
    filters: true,
    includes: true,
    operatorFilters: true,
    search: true,
    select: true,
    sort: true
  };

  /**
   * Directus-native name of the metadata query key
   *
   * `meta` has no `QueryBuilderOptions` slot and is fixed by the server,
   * so it lives as a private static to be visible in one place.
   */
  private static readonly _metaKey = 'meta';

  /**
   * Emit Directus-format query-string segments in canonical order:
   * filter (merged) → sort → fields → search → meta → limit → page
   *
   * Simple filters and operator filters share a single `filter` wrapper
   * so qs emits one ordered, deeply-nested bracket structure rather than
   * two duplicate top-level `filter[...]` blocks.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, options, out);
    this._appendSort(state, options, out);
    this._appendFields(state, options, out);
    this._appendSearch(state, options, out);
    this._appendMeta(out);
    this._appendLimit(state, options, out);
    this._appendPage(state, options, out);

    return out;
  }

  /**
   * Append the single `fields=` CSV combining flat columns, whole
   * relations, and column-projected relations
   *
   * Flat columns come from `addSelect`; relations from `addIncludes`
   * emit as `rel.*`; embedded relations from `addEmbedded` emit one
   * `rel.col` entry per column (or `rel.*` when no columns were given).
   * A relation present in both folds into the embedded fragment, which
   * carries the column information. When relations are present but no
   * flat columns were selected, the flat part defaults to `*` so the
   * base item's columns are not silently dropped from the projection.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFields(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    const relations: string[] = [];

    state.includes.forEach(relation => {
      if (relation in state.embedded) {
        return;
      }

      relations.push(`${relation}.*`);
    });

    Object.keys(state.embedded).forEach(relation => {
      const columns = state.embedded[relation];

      if (!columns.length) {
        relations.push(`${relation}.*`);
        return;
      }

      relations.push(...columns.map(column => `${relation}.${column}`));
    });

    if (!state.select.length && !relations.length) {
      return;
    }

    const columns = state.select.length ? state.select : ['*'];

    out.push(`${options.fields}=${[...columns, ...relations].join(',')}`);
  }

  /**
   * Append the unified `filter[...]` wrapper combining simple filters
   * and operator filters
   *
   * Both kinds emit into the same nested object under the filter key so
   * qs produces a single deeply-bracketed block per request. Simple
   * single-value filters fold to `_eq`; simple multi-value filters fold
   * to `_in` (CSV). Operator filters then merge into the same per-field
   * map, potentially co-existing with a simple filter on the same field.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    const simpleKeys = Object.keys(state.filters);

    if (!simpleKeys.length && !state.operatorFilters.length) {
      return;
    }

    const filter: Record<string, DirectusFilterPayload> = {};

    simpleKeys.forEach(key => {
      const values = state.filters[key];

      if (!values.length) {
        return;
      }

      /* eslint-disable @typescript-eslint/naming-convention -- `_eq` / `_in` are fixed by the Directus wire format */
      filter[key] = values.length === 1
        ? { _eq: values[0] }
        : { _in: values.join(',') };
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    state.operatorFilters.forEach((operatorFilter: IOperatorFilter) => {
      const payload = this._formatOperatorPayload(operatorFilter);

      filter[operatorFilter.field] = {
        ...(filter[operatorFilter.field] ?? {}),
        ...payload
      };
    });

    if (!Object.keys(filter).length) {
      return;
    }

    out.push(qs.stringify({ [options.filters]: filter }, { encode: false }));
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
   * Append the constant `meta=total_count,filter_count` parameter
   *
   * Always emitted: the Directus response strategy reads the totals from
   * `meta`, which the server only includes when the request asks for it.
   *
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendMeta(out: string[]): void {
    out.push(`${DirectusRequestStrategy._metaKey}=total_count,filter_count`);
  }

  /**
   * Append the page parameter
   *
   * Directus pages are 1-indexed, matching the library state directly.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPage(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.page}=${state.page}`);
  }

  /**
   * Append the `search=` global full-text search parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSearch(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.search) {
      return;
    }

    out.push(`${options.search}=${state.search}`);
  }

  /**
   * Append the `sort=-created_at,name` CSV parameter
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const fields = state.sorts.map(sort =>
      sort.order === SortEnum.DESC ? `-${sort.field}` : sort.field
    );

    out.push(`${options.sort}=${fields.join(',')}`);
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into Directus'
   * `_operator → value` payload shape
   *
   * The mapping is library-canonical → Directus-native:
   * - `EQ`/`GT`/`GTE`/`LT`/`LTE` → `_eq`/`_gt`/`_gte`/`_lt`/`_lte`
   * - `CONTAINS` → `_contains`; `ILIKE` → `_icontains` (case-insensitive)
   * - `SW` → `_starts_with`
   * - `IN` → `_in` (CSV)
   * - `BTW` → `_between` with `min,max` (arity-checked)
   * - `NOT` → `_neq` (single value) / `_nin` (multi-value, CSV)
   * - `NULL` → `_null=true` (when value is `true`) / `_nnull=true` (when
   *   value is `false`); arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no Directus equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns A `{ _operator: value }` payload ready to merge under
   * `filter[field]`
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorPayload(filter: IOperatorFilter): DirectusFilterPayload {
    const { operator, values } = filter;
    const first = values[0];

    /* eslint-disable @typescript-eslint/naming-convention -- `_operator` keys are fixed by the Directus wire format */
    switch (operator) {
      case FilterOperatorEnum.EQ: return { _eq: first };
      case FilterOperatorEnum.GT: return { _gt: first };
      case FilterOperatorEnum.GTE: return { _gte: first };
      case FilterOperatorEnum.LT: return { _lt: first };
      case FilterOperatorEnum.LTE: return { _lte: first };
      case FilterOperatorEnum.CONTAINS: return { _contains: first };
      case FilterOperatorEnum.ILIKE: return { _icontains: first };
      case FilterOperatorEnum.IN: return { _in: values.join(',') };
      case FilterOperatorEnum.SW: return { _starts_with: first };

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return { _between: values.join(',') };
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? { _neq: first }
          : { _nin: values.join(',') };

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? { _null: true } : { _nnull: true };
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
    /* eslint-enable @typescript-eslint/naming-convention */
  }
}

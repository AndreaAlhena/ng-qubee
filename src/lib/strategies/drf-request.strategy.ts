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
 * Right-hand-side payload of a django-filter `field__lookup=value` segment
 *
 * The lookup suffix (or empty string for the default `exact` match) and
 * the serialized value combine into the flat key=value pair django-filter
 * reads on the server side.
 */
type DrfLookupSuffix = string;

/**
 * Request strategy for the Django REST Framework (DRF) driver
 *
 * Generates URIs in DRF's flat query-parameter format, augmented by
 * django-filter's double-underscore lookup convention:
 *
 * - Simple filters: `field=value` (multi-value collapses to `field__in=v1,v2`)
 * - Operator filters: `field__lookup=value` (translated from
 *   `FilterOperatorEnum` — `GTE`→`__gte`, `ILIKE`→`__icontains`,
 *   `BTW`→`__range`, `NULL`→`__isnull`, etc.)
 * - Ordering: `ordering=-field1,field2` (`-` prefix = DESC)
 * - Search: `search=term` (DRF's SearchFilter)
 * - Pagination: `page=N&page_size=M` (PageNumberPagination)
 *
 * `ordering` and `page_size` are DRF-idiomatic param names and are
 * intentionally not configurable via `QueryBuilderOptions` — same
 * precedent as PostgREST's `order` and `offset`. PostgREST's full-text
 * search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) and the generic
 * `NOT` have no django-filter equivalent and throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://www.django-rest-framework.org/api-guide/filtering/
 * @see https://django-filter.readthedocs.io/
 */
export class DrfRequestStrategy extends AbstractRequestStrategy {

  /**
   * Simple filters, operator filters (django-filter lookups), sorts, and
   * global search — no per-model fields, no relation includes, no flat
   * select (django-restql adds it but is not core DRF)
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: false,
    operatorFilters: true,
    search: true,
    select: false,
    sort: true
  };

  /**
   * DRF-native names of the three hardcoded query keys
   *
   * `ordering` and `page_size` are DRF/django-filter conventions and are
   * intentionally not configurable through `QueryBuilderOptions`. `page`
   * matches the default `QueryBuilderOptions.page`, and `search` matches
   * the default `QueryBuilderOptions.search`, so those flow through the
   * shared options object.
   */
  private static readonly _orderingKey = 'ordering';
  private static readonly _pageSizeKey = 'page_size';

  /**
   * Emit DRF-format query-string segments in canonical order:
   * filters → operator filters → ordering → search → pagination
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendOperatorFilters(state, out);
    this._appendOrdering(state, out);
    this._appendSearch(state, options, out);
    this._appendPagination(state, options, out);

    return out;
  }

  /**
   * Append simple filter parameters
   *
   * Single-value filters emit `field=value` (django-filter's default
   * exact match). Multi-value filters collapse to django-filter's
   * `field__in=v1,v2,v3` form, which is the idiomatic way to express
   * "value in list" in DRF.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, out: string[]): void {
    const keys = Object.keys(state.filters);

    if (!keys.length) {
      return;
    }

    keys.forEach(key => {
      const values = state.filters[key];

      if (!values.length) {
        return;
      }

      if (values.length === 1) {
        out.push(`${key}=${values[0]}`);
        return;
      }

      out.push(`${key}__in=${values.join(',')}`);
    });
  }

  /**
   * Append operator-filter parameters as `field__lookup=value`
   *
   * Maps each `FilterOperatorEnum` value to a django-filter lookup
   * suffix. `BTW` expands to `field__range=min,max`; `NULL` emits
   * `field__isnull=true|false`; the generic `NOT` and PostgREST-only
   * FTS operators are unsupported.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator has no
   * django-filter equivalent
   */
  private _appendOperatorFilters(state: IQueryBuilderState, out: string[]): void {
    if (!state.operatorFilters.length) {
      return;
    }

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      const [suffix, value] = this._formatOperatorPayload(filter);
      const key = suffix ? `${filter.field}__${suffix}` : filter.field;

      out.push(`${key}=${value}`);
    });
  }

  /**
   * Append `ordering=-field1,field2` (django's `-` prefix = DESC)
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOrdering(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.order === SortEnum.DESC ? '-' : ''}${sort.field}`
    );

    out.push(`${DrfRequestStrategy._orderingKey}=${pairs.join(',')}`);
  }

  /**
   * Append `page=N&page_size=M`
   *
   * `page` follows `options.page` (default `page`, matching DRF); the
   * size key is hardcoded to DRF's idiomatic `page_size`.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.page}=${state.page}`);
    out.push(`${DrfRequestStrategy._pageSizeKey}=${state.limit}`);
  }

  /**
   * Append `search=term` when a search term is set
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
   * Translate a `FilterOperatorEnum` operator filter into a
   * `[suffix, serializedValue]` pair
   *
   * The suffix is appended to the field name with a `__` separator on the
   * wire side (`field__gte=18`). The empty string means "no suffix" —
   * django-filter's implicit `exact` lookup.
   *
   * Mapping:
   * - `EQ` → `''` (no suffix; default exact match)
   * - `GT`/`GTE`/`LT`/`LTE`/`CONTAINS` → identity (lowercased name)
   * - `ILIKE` → `icontains` (closest case-insensitive analog)
   * - `IN` → `in` with comma-joined values
   * - `SW` → `startswith`
   * - `BTW` → `range` with comma-joined `[min, max]` (arity-checked)
   * - `NULL` → `isnull` with boolean value (arity- and type-checked)
   * - `NOT` → `UnsupportedFilterOperatorError` (no generic negation in
   *   django-filter; use `__exclude` on the queryset instead)
   * - `FTS`/`PLFTS`/`PHFTS`/`WFTS` → `UnsupportedFilterOperatorError`
   *
   * @param filter - The operator filter to translate
   * @returns A `[lookupSuffix, serializedValue]` tuple
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator has no
   * django-filter equivalent
   */
  private _formatOperatorPayload(filter: IOperatorFilter): [DrfLookupSuffix, string] {
    const { operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return ['', String(first)];
      case FilterOperatorEnum.GT: return ['gt', String(first)];
      case FilterOperatorEnum.GTE: return ['gte', String(first)];
      case FilterOperatorEnum.LT: return ['lt', String(first)];
      case FilterOperatorEnum.LTE: return ['lte', String(first)];
      case FilterOperatorEnum.CONTAINS: return ['contains', String(first)];
      case FilterOperatorEnum.ILIKE: return ['icontains', String(first)];
      case FilterOperatorEnum.IN: return ['in', values.join(',')];
      case FilterOperatorEnum.SW: return ['startswith', String(first)];

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return ['range', values.join(',')];
      }

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return ['isnull', String(first)];
      }

      case FilterOperatorEnum.NOT:
      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

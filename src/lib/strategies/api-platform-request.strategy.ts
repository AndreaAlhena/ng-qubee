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
 * Request strategy for the API Platform (Symfony) driver
 *
 * Generates URIs in [API Platform's filter format](https://api-platform.com/docs/core/filters/):
 * - Filters: `field=value` (exact); multi-value uses the array syntax
 *   (`field[]=v1&field[]=v2`, OR semantics)
 * - Operator filters: bracket syntax `field[op]=value` — RangeFilter
 *   (`gt`/`gte`/`lt`/`lte`/`between`), SearchFilter strategies
 *   (`partial`/`ipartial`/`start`), ExistsFilter (`exists`) — see the
 *   mapping on `_formatOperatorSegments`
 * - Relation filtering: dot paths pass through (`author.name=John` via
 *   `addFilter('author.name', 'John')`)
 * - Sorts: `order[field]=asc` / `order[field]=desc` (one param per rule)
 * - Pagination: `page=N&itemsPerPage=M`
 *
 * The `order` and `itemsPerPage` keys are API Platform conventions and
 * intentionally not configurable through `QueryBuilderOptions`; `page`
 * honours the existing option key (its default matches the wire format).
 *
 * Date fields use API Platform's DateFilter (`field[after]=…`,
 * `field[before]=…`) — there is no `FilterOperatorEnum` counterpart, but
 * the bracket key passes through `addFilter` directly:
 * `addFilter('createdAt[after]', '2023-01-01')`.
 *
 * `NOT` (no negation filter in API Platform core) and the
 * PostgREST-native full-text operators (`FTS`, `PHFTS`, `PLFTS`,
 * `WFTS`) throw `UnsupportedFilterOperatorError`.
 *
 * @see https://api-platform.com/docs/core/filters/
 */
export class ApiPlatformRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts — no per-model fields, no
   * includes (relations embed via serialization groups server-side),
   * no flat select, no global search parameter
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: false,
    operatorFilters: true,
    search: false,
    select: false,
    sort: true
  };

  /**
   * API Platform-native names of the two hardcoded query keys
   *
   * `order[...]` and `itemsPerPage` are fixed conventions of API
   * Platform's OrderFilter and pagination; they are intentionally not
   * configurable through `QueryBuilderOptions` and live as private
   * statics so they are visible in one place.
   */
  private static readonly _itemsPerPageKey = 'itemsPerPage';
  private static readonly _orderKey = 'order';

  /**
   * Emit API Platform-format query-string segments in canonical order:
   * filters → operator filters → order → page → itemsPerPage
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration (used
   * for `page`, whose default matches the wire format)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendOperatorFilters(state, out);
    this._appendOrder(state, out);
    this._appendPage(state, options, out);
    this._appendItemsPerPage(state, out);

    return out;
  }

  /**
   * Append simple filter parameters
   *
   * A single value emits the bare exact-match form (`field=value`);
   * multiple values use API Platform's array syntax with OR semantics
   * (`field[]=v1&field[]=v2`).
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

      if (values.length === 1) {
        out.push(`${field}=${values[0]}`);
        return;
      }

      values.forEach(value => out.push(`${field}[]=${value}`));
    });
  }

  /**
   * Append the itemsPerPage parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendItemsPerPage(state: IQueryBuilderState, out: string[]): void {
    out.push(`${ApiPlatformRequestStrategy._itemsPerPageKey}=${state.limit}`);
  }

  /**
   * Append explicit operator filters in the bracket syntax
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOperatorFilters(state: IQueryBuilderState, out: string[]): void {
    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      out.push(...this._formatOperatorSegments(filter));
    });
  }

  /**
   * Append `order[field]=asc` / `order[field]=desc` params, one per rule
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOrder(state: IQueryBuilderState, out: string[]): void {
    state.sorts.forEach(sort => {
      const direction = sort.order === SortEnum.DESC ? 'desc' : 'asc';

      out.push(`${ApiPlatformRequestStrategy._orderKey}[${sort.field}]=${direction}`);
    });
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
   * Translate a `FilterOperatorEnum` operator filter into one or more
   * API Platform bracket segments
   *
   * The mapping is library-canonical → API Platform-native:
   * - `EQ` → bare exact match (`field=value`, SearchFilter exact)
   * - `GT`/`GTE`/`LT`/`LTE` → RangeFilter (`field[gt]=v`, …)
   * - `BTW` → RangeFilter `field[between]=min..max` (arity-checked)
   * - `CONTAINS` → SearchFilter partial (`field[partial]=v`)
   * - `ILIKE` → SearchFilter ipartial (`field[ipartial]=v`,
   *   case-insensitive)
   * - `SW` → SearchFilter start (`field[start]=v`)
   * - `IN` → array syntax (`field[]=v1&field[]=v2`)
   * - `NULL` → ExistsFilter — **inverted**: `true` (IS NULL) emits
   *   `field[exists]=false`, `false` (IS NOT NULL) emits
   *   `field[exists]=true`; arity- and type-checked
   *
   * `NOT` (API Platform core ships no negation filter) and PostgREST's
   * full-text-search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns One or more bracket-syntax query-string segments
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator has no API
   * Platform equivalent
   */
  private _formatOperatorSegments(filter: IOperatorFilter): string[] {
    const { field, operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return [`${field}=${first}`];
      case FilterOperatorEnum.GT: return [`${field}[gt]=${first}`];
      case FilterOperatorEnum.GTE: return [`${field}[gte]=${first}`];
      case FilterOperatorEnum.LT: return [`${field}[lt]=${first}`];
      case FilterOperatorEnum.LTE: return [`${field}[lte]=${first}`];
      case FilterOperatorEnum.CONTAINS: return [`${field}[partial]=${first}`];
      case FilterOperatorEnum.ILIKE: return [`${field}[ipartial]=${first}`];
      case FilterOperatorEnum.SW: return [`${field}[start]=${first}`];
      case FilterOperatorEnum.IN: return values.map(value => `${field}[]=${value}`);

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return [`${field}[between]=${values[0]}..${values[1]}`];
      }

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        // ExistsFilter semantics are inverted relative to NULL: exists=false ⇔ IS NULL
        return first ? [`${field}[exists]=false`] : [`${field}[exists]=true`];
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

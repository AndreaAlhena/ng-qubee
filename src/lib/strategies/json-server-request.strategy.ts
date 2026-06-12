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
 * Request strategy for the json-server driver
 *
 * Generates URIs in [json-server's](https://github.com/typicode/json-server)
 * query format — the de-facto standard mock REST API for prototyping:
 * - Filters: `field=value` (exact, no operator); multi-value folds to the
 *   `in` list (`field:in=v1,v2`)
 * - Operator filters: colon syntax `field:op=value` — see the mapping on
 *   `_formatOperatorSegments`
 * - Sorts: `_sort=-views,title` (CSV, `-` prefix = DESC)
 * - Search: `q=term` (full-text search)
 * - Pagination: `_page=N&_per_page=M`
 *
 * The underscore-prefixed system params (`_page`, `_per_page`, `_sort`)
 * and the `q` search key are fixed by the server and intentionally not
 * configurable through `QueryBuilderOptions`; they live as private
 * statics so they are visible in one place.
 *
 * json-server has no per-model field selection, no relation includes,
 * no column projection — the corresponding fluent methods throw the
 * matching `Unsupported*Error`. `ILIKE` (no case-insensitive variant),
 * `NULL` (no null check), and the PostgREST-native full-text operators
 * (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://github.com/typicode/json-server
 */
export class JsonServerRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, global search — no per-model
   * fields, no includes, no flat select, no embedded resources
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
   * json-server-native names of the four hardcoded query keys
   *
   * The underscore prefix marks system params apart from filter fields;
   * these keys are fixed by the server and intentionally not
   * configurable through `QueryBuilderOptions`.
   */
  private static readonly _pageKey = '_page';
  private static readonly _perPageKey = '_per_page';
  private static readonly _qKey = 'q';
  private static readonly _sortKey = '_sort';

  /**
   * Emit json-server-format query-string segments in canonical order:
   * filters → operator filters → _sort → q → _page → _per_page
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * json-server's system keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendOperatorFilters(state, out);
    this._appendSort(state, out);
    this._appendSearch(state, out);
    this._appendPage(state, out);
    this._appendPerPage(state, out);

    return out;
  }

  /**
   * Append simple filter parameters
   *
   * A single value emits the bare exact-match form (`field=value`);
   * multiple values fold to the `in` list (`field:in=v1,v2`).
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
        : `${field}:in=${values.join(',')}`);
    });
  }

  /**
   * Append explicit operator filters in the colon syntax
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
   * Append the _page parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPage(state: IQueryBuilderState, out: string[]): void {
    out.push(`${JsonServerRequestStrategy._pageKey}=${state.page}`);
  }

  /**
   * Append the _per_page parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPerPage(state: IQueryBuilderState, out: string[]): void {
    out.push(`${JsonServerRequestStrategy._perPageKey}=${state.limit}`);
  }

  /**
   * Append the `q=` full-text search parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSearch(state: IQueryBuilderState, out: string[]): void {
    if (!state.search) {
      return;
    }

    out.push(`${JsonServerRequestStrategy._qKey}=${state.search}`);
  }

  /**
   * Append the `_sort=-views,title` CSV parameter
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

    out.push(`${JsonServerRequestStrategy._sortKey}=${fields.join(',')}`);
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into one or more
   * json-server `field:op=value` segments
   *
   * The mapping is library-canonical → json-server-native:
   * - `EQ` → `:eq`; `GT`/`GTE`/`LT`/`LTE` → `:gt` / `:gte` / `:lt` / `:lte`
   * - `CONTAINS` → `:contains`
   * - `SW` → `:startsWith`
   * - `IN` → `:in` (CSV)
   * - `BTW` → **two** AND-ed segments (`field:gte=min` and
   *   `field:lte=max`, arity-checked)
   * - `NOT` → `:ne` — one segment per value, AND-ed
   *
   * `ILIKE` (json-server has no case-insensitive variant), `NULL` (no
   * null-check operator), and PostgREST's full-text-search operators
   * (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns One or more `field:op=value` query-string segments
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values
   * @throws {UnsupportedFilterOperatorError} If the operator has no
   * json-server equivalent
   */
  private _formatOperatorSegments(filter: IOperatorFilter): string[] {
    const { field, operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return [`${field}:eq=${first}`];
      case FilterOperatorEnum.GT: return [`${field}:gt=${first}`];
      case FilterOperatorEnum.GTE: return [`${field}:gte=${first}`];
      case FilterOperatorEnum.LT: return [`${field}:lt=${first}`];
      case FilterOperatorEnum.LTE: return [`${field}:lte=${first}`];
      case FilterOperatorEnum.CONTAINS: return [`${field}:contains=${first}`];
      case FilterOperatorEnum.SW: return [`${field}:startsWith=${first}`];
      case FilterOperatorEnum.IN: return [`${field}:in=${values.join(',')}`];

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return [`${field}:gte=${values[0]}`, `${field}:lte=${values[1]}`];
      }

      case FilterOperatorEnum.NOT:
        return values.map(value => `${field}:ne=${value}`);

      case FilterOperatorEnum.ILIKE:
      case FilterOperatorEnum.NULL:
      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

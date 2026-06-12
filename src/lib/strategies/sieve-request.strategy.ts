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
 * Request strategy for the Sieve (.NET) driver
 *
 * Generates URIs in [Sieve's compact expression format](https://github.com/Biarity/Sieve):
 * - Filters: a single `filters=` parameter holding comma-joined (AND)
 *   `Field{op}Value` terms; multi-value terms use the pipe (OR) on the
 *   value side (`status==active|pending`)
 * - Operator filters: translated from `FilterOperatorEnum` — see the
 *   mapping on `_formatOperatorTerms`
 * - Sorts: `sorts=field,-other` (CSV, `-` prefix = DESC)
 * - Pagination: `page=N&pageSize=N`
 *
 * Sieve has no per-model field selection, no relation includes, no flat
 * column selection, and no global search parameter — the corresponding
 * fluent methods throw the matching `Unsupported*Error`. PostgREST-native
 * full-text search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://github.com/Biarity/Sieve
 */
export class SieveRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts — no per-model fields, no includes,
   * no flat select, no global search (use `CONTAINS` / `ILIKE` operator
   * filters for partial matches)
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
   * Sieve-native names of the three hardcoded query keys
   *
   * Sieve's model binder reads `filters`, `sorts`, and `pageSize` (the
   * plural forms differ from the library-wide `filter` / `sort` /
   * `limit` defaults); these keys are intentionally not configurable
   * through `QueryBuilderOptions` and live as private statics so they
   * are visible in one place.
   */
  private static readonly _filtersKey = 'filters';
  private static readonly _pageSizeKey = 'pageSize';
  private static readonly _sortsKey = 'sorts';

  /**
   * Emit Sieve-format query-string segments in canonical order:
   * filters → sorts → page → pageSize
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration (used
   * for `page`, whose default matches the wire format; the `filters` /
   * `sorts` / `pageSize` keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendSorts(state, out);
    this._appendPage(state, options, out);
    this._appendPageSize(state, out);

    return out;
  }

  /**
   * Append the single `filters=` parameter combining simple and operator
   * filters
   *
   * Each term is one `Field{op}Value` expression; terms join with the
   * comma (Sieve's AND). Simple single-value filters fold to `==`;
   * simple multi-value filters fold to a value-level pipe OR
   * (`field==v1|v2`).
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilters(state: IQueryBuilderState, out: string[]): void {
    const terms: string[] = [];

    Object.keys(state.filters).forEach(field => {
      const values = state.filters[field];

      if (!values.length) {
        return;
      }

      terms.push(`${field}==${values.join('|')}`);
    });

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      terms.push(...this._formatOperatorTerms(filter));
    });

    if (!terms.length) {
      return;
    }

    out.push(`${SieveRequestStrategy._filtersKey}=${terms.join(',')}`);
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
   * Append the pageSize parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPageSize(state: IQueryBuilderState, out: string[]): void {
    out.push(`${SieveRequestStrategy._pageSizeKey}=${state.limit}`);
  }

  /**
   * Append the `sorts=field,-other` CSV parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSorts(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const fields = state.sorts.map(sort =>
      sort.order === SortEnum.DESC ? `-${sort.field}` : sort.field
    );

    out.push(`${SieveRequestStrategy._sortsKey}=${fields.join(',')}`);
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into one or more
   * Sieve `Field{op}Value` terms
   *
   * The mapping is library-canonical → Sieve-native:
   * - `EQ` → `==`; `GT`/`GTE`/`LT`/`LTE` → `>` / `>=` / `<` / `<=`
   * - `CONTAINS` → `@=`; `ILIKE` → `@=*` (case-insensitive contains)
   * - `SW` → `_=` (starts with)
   * - `IN` → `==` with a value-level pipe OR (`field==v1|v2`)
   * - `BTW` → **two** AND-ed terms (`field>=min` and `field<=max`,
   *   arity-checked)
   * - `NOT` → `!=` — one term per value, AND-ed (`field!=v1,field!=v2`)
   * - `NULL` → `==null` (when value is `true`) / `!=null` (when value is
   *   `false`); arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no Sieve equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns One or more `Field{op}Value` terms ready to AND-join
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorTerms(filter: IOperatorFilter): string[] {
    const { field, operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return [`${field}==${first}`];
      case FilterOperatorEnum.GT: return [`${field}>${first}`];
      case FilterOperatorEnum.GTE: return [`${field}>=${first}`];
      case FilterOperatorEnum.LT: return [`${field}<${first}`];
      case FilterOperatorEnum.LTE: return [`${field}<=${first}`];
      case FilterOperatorEnum.CONTAINS: return [`${field}@=${first}`];
      case FilterOperatorEnum.ILIKE: return [`${field}@=*${first}`];
      case FilterOperatorEnum.SW: return [`${field}_=${first}`];
      case FilterOperatorEnum.IN: return [`${field}==${values.join('|')}`];

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return [`${field}>=${values[0]}`, `${field}<=${values[1]}`];
      }

      case FilterOperatorEnum.NOT:
        return values.map(value => `${field}!=${value}`);

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? [`${field}==null`] : [`${field}!=null`];
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

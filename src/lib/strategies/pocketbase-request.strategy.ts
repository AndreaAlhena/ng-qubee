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
 * Request strategy for the PocketBase driver
 *
 * Generates URIs in [PocketBase's records-list format](https://pocketbase.io/docs/api-records/):
 * - Filters: a single `filter=(...)` expression-language parameter —
 *   simple single-value filters fold to `field='value'`, multi-value
 *   filters fold to an OR group (`(field='v1' || field='v2')`), and all
 *   clauses join with ` && `
 * - Operator filters: expression terms (`field>=10`, `field~'val'`) —
 *   see the mapping on `_formatOperatorClause`
 * - Sorts: `sort=-created,title` (CSV, `-` prefix = DESC)
 * - Field selection (flat): `fields=id,title` (CSV)
 * - Relation expansion: `expand=author,comments` (CSV)
 * - Pagination (page-based): `page=N&perPage=M`
 *
 * The `page` / `perPage` / `sort` / `filter` / `expand` / `fields` keys
 * are fixed by the PocketBase records API and intentionally not
 * configurable through `QueryBuilderOptions`; they live as private
 * statics so they are visible in one place.
 *
 * String literals are single-quoted with embedded quotes
 * backslash-escaped (`name='O\'Brien'`); numbers and booleans emit
 * bare. PocketBase has no global search param (use `~` terms instead)
 * and no per-model field selection — the corresponding fluent methods
 * throw the matching `Unsupported*Error`. The PostgREST-native
 * full-text operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
 * `UnsupportedFilterOperatorError`.
 *
 * @see https://pocketbase.io/docs/api-records/
 */
export class PocketbaseRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, expand (`includes`), flat field
   * selection (`select`) — no per-model fields, no global search, no
   * embedded resources
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: true,
    operatorFilters: true,
    search: false,
    select: true,
    sort: true
  };

  /**
   * PocketBase-native names of the six hardcoded query keys
   *
   * The records API reads exactly these names; they are intentionally
   * not configurable through `QueryBuilderOptions` and live as private
   * statics so they are visible in one place.
   */
  private static readonly _expandKey = 'expand';
  private static readonly _fieldsKey = 'fields';
  private static readonly _filterKey = 'filter';
  private static readonly _pageKey = 'page';
  private static readonly _perPageKey = 'perPage';
  private static readonly _sortKey = 'sort';

  /**
   * Emit PocketBase-format query-string segments in canonical order:
   * expand → fields → filter (merged) → sort → page → perPage
   *
   * Simple filters and operator filters share the single `filter=(...)`
   * parameter so the server receives one combined expression rather
   * than two conflicting `filter` params.
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * PocketBase's wire keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendExpand(state, out);
    this._appendFields(state, out);
    this._appendFilter(state, out);
    this._appendSort(state, out);
    this._appendPagination(state, out);

    return out;
  }

  /**
   * Append the `expand=` CSV from the includes array
   *
   * Nested expansion (`author.address`) passes through verbatim when
   * given as a dotted include name.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendExpand(state: IQueryBuilderState, out: string[]): void {
    if (!state.includes.length) {
      return;
    }

    out.push(`${PocketbaseRequestStrategy._expandKey}=${state.includes.join(',')}`);
  }

  /**
   * Append the `fields=` CSV from the flat select array
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFields(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(`${PocketbaseRequestStrategy._fieldsKey}=${state.select.join(',')}`);
  }

  /**
   * Append the single `filter=(...)` expression combining simple
   * filters and operator filters
   *
   * Clauses join with ` && `; multi-value clauses keep their own
   * parentheses so OR groups stay correctly scoped inside the AND
   * chain.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilter(state: IQueryBuilderState, out: string[]): void {
    const clauses: string[] = [];

    Object.keys(state.filters).forEach(field => {
      const values = state.filters[field];

      if (!values.length) {
        return;
      }

      clauses.push(values.length === 1
        ? `${field}=${this._formatValue(values[0])}`
        : `(${values.map(value => `${field}=${this._formatValue(value)}`).join(' || ')})`);
    });

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      clauses.push(this._formatOperatorClause(filter));
    });

    if (!clauses.length) {
      return;
    }

    out.push(`${PocketbaseRequestStrategy._filterKey}=(${clauses.join(' && ')})`);
  }

  /**
   * Append the `page=` / `perPage=` pagination pair
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, out: string[]): void {
    out.push(`${PocketbaseRequestStrategy._pageKey}=${state.page}`);
    out.push(`${PocketbaseRequestStrategy._perPageKey}=${state.limit}`);
  }

  /**
   * Append the `sort=-created,title` CSV parameter
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

    out.push(`${PocketbaseRequestStrategy._sortKey}=${fields.join(',')}`);
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into one
   * PocketBase expression clause
   *
   * The mapping is library-canonical → PocketBase-native:
   * - `EQ` → `field='v'`; `GT`/`GTE`/`LT`/`LTE` → `>` / `>=` / `<` / `<=`
   * - `CONTAINS`/`ILIKE` → `field~'v'` (PocketBase's `~` is a
   *   case-insensitive LIKE that auto-wraps the operand in `%...%`)
   * - `SW` → `field~'v%'` (explicit trailing wildcard disables the
   *   auto-wrap)
   * - `IN` → OR group `(field='v1' || field='v2')`
   * - `BTW` → AND group `(field>=min && field<=max)` (arity-checked)
   * - `NOT` → `field!='v'` (single) / AND group of `!=` terms (multi)
   * - `NULL` → `field=null` (when value is `true`) / `field!=null`
   *   (when value is `false`); arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no PocketBase equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns One expression clause ready to join into `filter=(...)`
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorClause(filter: IOperatorFilter): string {
    const { field, operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return `${field}=${this._formatValue(first)}`;
      case FilterOperatorEnum.GT: return `${field}>${this._formatValue(first)}`;
      case FilterOperatorEnum.GTE: return `${field}>=${this._formatValue(first)}`;
      case FilterOperatorEnum.LT: return `${field}<${this._formatValue(first)}`;
      case FilterOperatorEnum.LTE: return `${field}<=${this._formatValue(first)}`;
      case FilterOperatorEnum.CONTAINS: return `${field}~${this._formatValue(first)}`;
      case FilterOperatorEnum.ILIKE: return `${field}~${this._formatValue(first)}`;
      case FilterOperatorEnum.SW: return `${field}~'${this._escape(String(first))}%'`;
      case FilterOperatorEnum.IN: return `(${values.map(value => `${field}=${this._formatValue(value)}`).join(' || ')})`;

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return `(${field}>=${this._formatValue(values[0])} && ${field}<=${this._formatValue(values[1])})`;
      }

      case FilterOperatorEnum.NOT:
        return values.length === 1
          ? `${field}!=${this._formatValue(first)}`
          : `(${values.map(value => `${field}!=${this._formatValue(value)}`).join(' && ')})`;

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? `${field}=null` : `${field}!=null`;
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }

  /**
   * Backslash-escape single quotes inside a string literal
   *
   * @param value - The raw string value
   * @returns The escaped string, ready to wrap in single quotes
   */
  private _escape(value: string): string {
    return value.replace(/'/g, '\\\'');
  }

  /**
   * Format a filter value as a PocketBase expression literal
   *
   * Strings are single-quoted (embedded quotes backslash-escaped);
   * numbers and booleans emit bare, matching the expression language's
   * literal rules.
   *
   * @param value - The raw filter value
   * @returns The formatted literal
   */
  private _formatValue(value: string | number | boolean): string {
    return typeof value === 'string' ? `'${this._escape(value)}'` : `${value}`;
  }
}

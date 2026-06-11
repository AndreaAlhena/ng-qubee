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
 * Request strategy for the OData v4 driver
 *
 * Generates URIs using [OData's system query options](https://www.odata.org/getting-started/basic-tutorial/#queryData):
 * - Filters: a single `$filter=` parameter holding ` and `-joined terms in
 *   OData's expression language (`Price gt 20 and Category eq 'Electronics'`)
 * - Operator filters: translated from `FilterOperatorEnum` — see the
 *   mapping on `_formatOperatorTerms`
 * - Sorts: `$orderby=field asc,other desc` (CSV with explicit direction)
 * - Select: `$select=col1,col2`
 * - Expand: `$expand=rel,other($select=col1,col2)` — plain relations come
 *   from `addIncludes`, column-projected ones from `addEmbedded`
 * - Search: `$search=term` (OData v4 free-text search)
 * - Pagination: `$top=N&$skip=M` (skip derived from state.page) plus a
 *   constant `$count=true` so responses carry the `@odata.count` total
 *   the response strategy needs
 *
 * The `$`-prefixed parameter names are fixed by the OData specification
 * and intentionally not configurable through `QueryBuilderOptions`; they
 * live as private statics so they are visible in one place. String
 * literals are single-quoted with embedded quotes doubled (`'O''Brien'`)
 * per the OData ABNF; numbers and booleans are emitted bare.
 *
 * PostgREST-native full-text search operators (`FTS`, `PHFTS`, `PLFTS`,
 * `WFTS`) throw `UnsupportedFilterOperatorError` — use `$search` or the
 * `CONTAINS` / `ILIKE` operator filters instead.
 *
 * @see https://www.odata.org/
 * @see https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html
 */
export class OdataRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, operator filters, sorts, flat select, includes and embedded
   * (both folding into `$expand`), global search — no per-model fields
   * (OData has no JSON:API-style `fields[type]` projection)
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
   * OData-native names of the system query options
   *
   * The `$` prefix is mandated by the OData URL conventions; these keys
   * are intentionally not configurable through `QueryBuilderOptions` and
   * live as private statics so they are visible in one place.
   */
  private static readonly _countKey = '$count';
  private static readonly _expandKey = '$expand';
  private static readonly _filterKey = '$filter';
  private static readonly _orderbyKey = '$orderby';
  private static readonly _searchKey = '$search';
  private static readonly _selectKey = '$select';
  private static readonly _skipKey = '$skip';
  private static readonly _topKey = '$top';

  /**
   * Emit OData-format query-string segments in canonical order:
   * $filter → $orderby → $select → $expand → $search → $count → $top → $skip
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused —
   * every OData system query option name is fixed by the specification)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilter(state, out);
    this._appendOrderby(state, out);
    this._appendSelect(state, out);
    this._appendExpand(state, out);
    this._appendSearch(state, out);
    this._appendCount(out);
    this._appendTop(state, out);
    this._appendSkip(state, out);

    return out;
  }

  /**
   * Append the constant `$count=true` parameter
   *
   * Always emitted: the OData response strategy reads the total from
   * `@odata.count`, which servers only include when the request asks
   * for it.
   *
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendCount(out: string[]): void {
    out.push(`${OdataRequestStrategy._countKey}=true`);
  }

  /**
   * Append the `$expand=` parameter combining includes and embedded
   * relations
   *
   * Plain relations from `addIncludes` emit bare (`rel`); embedded
   * relations from `addEmbedded` emit with an inline projection
   * (`rel($select=col1,col2)`) or bare when no columns were given. A
   * relation present in both folds into the embedded fragment, which
   * carries the column information.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendExpand(state: IQueryBuilderState, out: string[]): void {
    const fragments: string[] = [];

    state.includes.forEach(relation => {
      if (relation in state.embedded) {
        return;
      }

      fragments.push(relation);
    });

    Object.keys(state.embedded).forEach(relation => {
      const columns = state.embedded[relation];

      fragments.push(columns.length ? `${relation}(${OdataRequestStrategy._selectKey}=${columns.join(',')})` : relation);
    });

    if (!fragments.length) {
      return;
    }

    out.push(`${OdataRequestStrategy._expandKey}=${fragments.join(',')}`);
  }

  /**
   * Append the single `$filter=` parameter combining simple and operator
   * filters
   *
   * Each term is one OData boolean expression; terms join with ` and `.
   * Simple single-value filters fold to `eq`; simple multi-value filters
   * fold to the `in` list operator (`field in ('v1','v2')`).
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFilter(state: IQueryBuilderState, out: string[]): void {
    const terms: string[] = [];

    Object.keys(state.filters).forEach(field => {
      const values = state.filters[field];

      if (!values.length) {
        return;
      }

      terms.push(values.length === 1
        ? `${field} eq ${this._formatLiteral(values[0])}`
        : `${field} in (${values.map(value => this._formatLiteral(value)).join(',')})`);
    });

    state.operatorFilters.forEach((filter: IOperatorFilter) => {
      terms.push(...this._formatOperatorTerms(filter));
    });

    if (!terms.length) {
      return;
    }

    out.push(`${OdataRequestStrategy._filterKey}=${terms.join(' and ')}`);
  }

  /**
   * Append the `$orderby=field asc,other desc` CSV parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendOrderby(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const pairs = state.sorts.map(sort =>
      `${sort.field} ${sort.order === SortEnum.DESC ? 'desc' : 'asc'}`
    );

    out.push(`${OdataRequestStrategy._orderbyKey}=${pairs.join(',')}`);
  }

  /**
   * Append the `$search=` free-text search parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSearch(state: IQueryBuilderState, out: string[]): void {
    if (!state.search) {
      return;
    }

    out.push(`${OdataRequestStrategy._searchKey}=${state.search}`);
  }

  /**
   * Append the `$select=col1,col2` projection parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSelect(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(`${OdataRequestStrategy._selectKey}=${state.select.join(',')}`);
  }

  /**
   * Append the `$skip=` parameter, derived from state.page
   *
   * OData uses offset-based pagination: the skip is computed as
   * `(page - 1) * limit`. Omitted when the skip would be 0 (i.e. page 1)
   * since OData defaults to no skip and dropping it keeps the URI shorter.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSkip(state: IQueryBuilderState, out: string[]): void {
    const skip = (state.page - 1) * state.limit;

    if (skip <= 0) {
      return;
    }

    out.push(`${OdataRequestStrategy._skipKey}=${skip}`);
  }

  /**
   * Append the `$top=` page-size parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendTop(state: IQueryBuilderState, out: string[]): void {
    out.push(`${OdataRequestStrategy._topKey}=${state.limit}`);
  }

  /**
   * Format a filter value as an OData primitive literal
   *
   * Strings are single-quoted with embedded single quotes doubled
   * (`'O''Brien'`) per the OData ABNF; numbers and booleans are emitted
   * bare.
   *
   * @param value - The raw filter value
   * @returns The OData-formatted literal
   */
  private _formatLiteral(value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, '\'\'')}'`;
    }

    return String(value);
  }

  /**
   * Translate a `FilterOperatorEnum` operator filter into one or more
   * OData boolean expressions
   *
   * The mapping is library-canonical → OData-native:
   * - `EQ` → `eq`; `GT`/`GTE`/`LT`/`LTE` → `gt` / `ge` / `lt` / `le`
   * - `CONTAINS` → `contains(field,'val')`
   * - `ILIKE` → `contains(tolower(field),tolower('val'))` (case-insensitive
   *   contains)
   * - `SW` → `startswith(field,'val')`
   * - `IN` → `field in ('v1','v2')` (OData v4.01 list operator)
   * - `BTW` → **two** AND-ed terms (`field ge min` and `field le max`,
   *   arity-checked)
   * - `NOT` → `ne` — one term per value, AND-ed (`field ne v1 and field ne v2`)
   * - `NULL` → `field eq null` (when value is `true`) / `field ne null`
   *   (when value is `false`); arity- and type-checked
   *
   * PostgREST's full-text-search operators (`FTS`, `PHFTS`, `PLFTS`,
   * `WFTS`) have no OData equivalent and throw
   * `UnsupportedFilterOperatorError`.
   *
   * @param filter - The operator filter to translate
   * @returns One or more OData boolean expressions ready to ` and `-join
   * @throws {InvalidFilterOperatorValueError} If `BTW` does not receive
   * exactly two values, or `NULL` does not receive exactly one boolean
   * @throws {UnsupportedFilterOperatorError} If the operator is a
   * PostgREST-only FTS variant
   */
  private _formatOperatorTerms(filter: IOperatorFilter): string[] {
    const { field, operator, values } = filter;
    const first = values[0];

    switch (operator) {
      case FilterOperatorEnum.EQ: return [`${field} eq ${this._formatLiteral(first)}`];
      case FilterOperatorEnum.GT: return [`${field} gt ${this._formatLiteral(first)}`];
      case FilterOperatorEnum.GTE: return [`${field} ge ${this._formatLiteral(first)}`];
      case FilterOperatorEnum.LT: return [`${field} lt ${this._formatLiteral(first)}`];
      case FilterOperatorEnum.LTE: return [`${field} le ${this._formatLiteral(first)}`];
      case FilterOperatorEnum.CONTAINS: return [`contains(${field},${this._formatLiteral(first)})`];
      case FilterOperatorEnum.ILIKE: return [`contains(tolower(${field}),tolower(${this._formatLiteral(first)}))`];
      case FilterOperatorEnum.SW: return [`startswith(${field},${this._formatLiteral(first)})`];
      case FilterOperatorEnum.IN: return [`${field} in (${values.map(value => this._formatLiteral(value)).join(',')})`];

      case FilterOperatorEnum.BTW: {
        if (values.length !== 2) {
          throw new InvalidFilterOperatorValueError(
            operator,
            'BTW requires exactly 2 values (min, max)'
          );
        }

        return [`${field} ge ${this._formatLiteral(values[0])}`, `${field} le ${this._formatLiteral(values[1])}`];
      }

      case FilterOperatorEnum.NOT:
        return values.map(value => `${field} ne ${this._formatLiteral(value)}`);

      case FilterOperatorEnum.NULL: {
        if (values.length !== 1 || typeof first !== 'boolean') {
          throw new InvalidFilterOperatorValueError(
            operator,
            'NULL requires exactly 1 boolean value (true → IS NULL, false → IS NOT NULL)'
          );
        }

        return first ? [`${field} eq null`] : [`${field} ne null`];
      }

      case FilterOperatorEnum.FTS:
      case FilterOperatorEnum.PHFTS:
      case FilterOperatorEnum.PLFTS:
      case FilterOperatorEnum.WFTS:
        throw new UnsupportedFilterOperatorError();
    }
  }
}

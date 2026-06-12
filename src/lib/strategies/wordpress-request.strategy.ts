import { SortEnum } from '../enums/sort.enum';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Request strategy for the WordPress REST API driver
 *
 * Generates URIs in the [WordPress REST API collection format](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/):
 * - Filters: `field=value` (collection parameters like `status`,
 *   `author`, `categories`); multi-value folds to a CSV (`field=v1,v2`,
 *   the list convention WordPress uses for ID params)
 * - Sorts: `orderby=field&order=asc|desc` — WordPress core supports a
 *   **single** orderby, so only the first sort rule is emitted
 * - Field selection (flat): `_fields=id,title` (CSV)
 * - Relation embedding: `_embed=author,wp:term` (CSV)
 * - Search: `search=term`
 * - Pagination (page-based): `page=N&per_page=M`
 *
 * The `page` / `per_page` / `orderby` / `order` / `search` and the
 * underscore-prefixed global params (`_fields`, `_embed`) are fixed by
 * the server and intentionally not configurable through
 * `QueryBuilderOptions`; they live as private statics so they are
 * visible in one place.
 *
 * WordPress caps `per_page` at **100** server-side (a 400
 * `rest_invalid_param` response beyond that); the cap is endpoint
 * policy rather than a syntax rule, so `validateLimit` keeps the
 * default positive-integer check and the server stays authoritative.
 * There is no generic comparison-operator syntax (only
 * parameter-specific helpers like `before`/`after` for dates, which
 * pass through `addFilter`), so `addFilterOperator` throws
 * `UnsupportedFilterOperatorError` via the capability gate.
 *
 * @see https://developer.wordpress.org/rest-api/reference/posts/#list-posts
 */
export class WordpressRequestStrategy extends AbstractRequestStrategy {

  /**
   * Filters, sorts, global search, flat field selection (`select`),
   * embedding (`includes`) — no operator filters, no per-model fields,
   * no embedded-column projection
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: true,
    includes: true,
    operatorFilters: false,
    search: true,
    select: true,
    sort: true
  };

  /**
   * WordPress-native names of the seven hardcoded query keys
   *
   * The underscore prefix marks the REST API's global params apart
   * from collection filters; all keys are fixed by the server and
   * intentionally not configurable through `QueryBuilderOptions`.
   */
  private static readonly _embedKey = '_embed';
  private static readonly _fieldsKey = '_fields';
  private static readonly _orderbyKey = 'orderby';
  private static readonly _orderKey = 'order';
  private static readonly _pageKey = 'page';
  private static readonly _perPageKey = 'per_page';
  private static readonly _searchKey = 'search';

  /**
   * Emit WordPress-format query-string segments in canonical order:
   * filters → orderby/order → _fields → _embed → search → page → per_page
   *
   * @param state - The current query builder state
   * @param _options - The query parameter key name configuration (unused;
   * WordPress' wire keys are fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, _options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendFilters(state, out);
    this._appendSort(state, out);
    this._appendFields(state, out);
    this._appendEmbed(state, out);
    this._appendSearch(state, out);
    this._appendPagination(state, out);

    return out;
  }

  /**
   * Append the `_embed=` CSV from the includes array
   *
   * A bare `_embed` (no value) embeds everything; this driver always
   * emits the named form so the response stays lean.
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendEmbed(state: IQueryBuilderState, out: string[]): void {
    if (!state.includes.length) {
      return;
    }

    out.push(`${WordpressRequestStrategy._embedKey}=${state.includes.join(',')}`);
  }

  /**
   * Append the `_fields=` CSV from the flat select array
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendFields(state: IQueryBuilderState, out: string[]): void {
    if (!state.select.length) {
      return;
    }

    out.push(`${WordpressRequestStrategy._fieldsKey}=${state.select.join(',')}`);
  }

  /**
   * Append simple filter parameters
   *
   * A single value emits the bare form (`status=publish`); multiple
   * values fold to the CSV list convention (`categories=2,3`).
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

      out.push(`${field}=${values.join(',')}`);
    });
  }

  /**
   * Append the `page=` / `per_page=` pagination pair
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPagination(state: IQueryBuilderState, out: string[]): void {
    out.push(`${WordpressRequestStrategy._pageKey}=${state.page}`);
    out.push(`${WordpressRequestStrategy._perPageKey}=${state.limit}`);
  }

  /**
   * Append the `search=` parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSearch(state: IQueryBuilderState, out: string[]): void {
    if (!state.search) {
      return;
    }

    out.push(`${WordpressRequestStrategy._searchKey}=${state.search}`);
  }

  /**
   * Append the `orderby=` / `order=` pair from the first sort rule
   *
   * WordPress core accepts a single `orderby` value — additional sort
   * rules in state are ignored by design (the server would reject a
   * CSV here).
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, out: string[]): void {
    if (!state.sorts.length) {
      return;
    }

    const [first] = state.sorts;

    out.push(`${WordpressRequestStrategy._orderbyKey}=${first.field}`);
    out.push(`${WordpressRequestStrategy._orderKey}=${first.order === SortEnum.DESC ? 'desc' : 'asc'}`);
  }
}

import { SortEnum } from '../enums/sort.enum';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { AbstractRequestStrategy } from './abstract-request.strategy';

/**
 * Request strategy for the Spring Data REST driver
 *
 * Generates URIs in [Spring Data REST's pagination format](https://docs.spring.io/spring-data/rest/reference/paging-and-sorting.html):
 * - Sorts: `sort=field,asc&sort=other,desc` (repeatable param, one per rule)
 * - Pagination: `page=N&size=N` — **`page` is 0-indexed on the wire**;
 *   the library state stays 1-indexed and the strategy subtracts 1 at
 *   emission time
 *
 * Spring Data REST defines no standard query parameter convention for
 * filtering, field selection, includes, or global search — those are
 * implemented server-side via custom query methods or Specifications.
 * The corresponding fluent methods (`addFilter`, `addFilterOperator`,
 * `addSelect`, `addFields`, `addIncludes`, `setSearch`) throw the
 * matching `Unsupported*Error` on this driver.
 *
 * @see https://docs.spring.io/spring-data/rest/reference/paging-and-sorting.html
 */
export class SpringRequestStrategy extends AbstractRequestStrategy {

  /**
   * Sorts only — Spring Data REST has no standard wire convention for
   * filters, operator filters, per-model fields, flat select, includes,
   * or global search
   */
  public readonly capabilities: IStrategyCapabilities = {
    embedded: false,
    fields: false,
    filters: false,
    includes: false,
    operatorFilters: false,
    search: false,
    select: false,
    sort: true
  };

  /**
   * Spring-native name of the hardcoded page-size query key
   *
   * The wire format is fixed (Spring's `PageableHandlerMethodArgumentResolver`
   * reads `size` by default); the key is intentionally not configurable
   * through `QueryBuilderOptions` and lives as a private static so it is
   * visible in one place.
   */
  private static readonly _sizeKey = 'size';

  /**
   * Emit Spring-format query-string segments in canonical order:
   * sort → page → size
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration (used
   * for `page` and `sort`, whose defaults match the wire format; the
   * `size` key is fixed by the server)
   * @returns Ordered query-string fragments
   */
  protected parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[] {
    const out: string[] = [];

    this._appendSort(state, options, out);
    this._appendPage(state, options, out);
    this._appendSize(state, out);

    return out;
  }

  /**
   * Append the 0-indexed page parameter
   *
   * The library state is 1-indexed (page 1 is the first page); Spring's
   * `page` request parameter is 0-indexed, so the strategy subtracts 1
   * at emission time.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendPage(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    out.push(`${options.page}=${state.page - 1}`);
  }

  /**
   * Append the size parameter
   *
   * @param state - The current query builder state
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSize(state: IQueryBuilderState, out: string[]): void {
    out.push(`${SpringRequestStrategy._sizeKey}=${state.limit}`);
  }

  /**
   * Append `sort=field,asc` params, one per sort rule (repeatable)
   *
   * Spring parses each `sort` occurrence independently — multiple rules
   * are expressed by repeating the parameter, not by comma-joining the
   * fields.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @param out - The accumulator the caller joins into the URI
   */
  private _appendSort(state: IQueryBuilderState, options: QueryBuilderOptions, out: string[]): void {
    state.sorts.forEach(sort => {
      const direction = sort.order === SortEnum.DESC ? 'desc' : 'asc';

      out.push(`${options.sort}=${sort.field},${direction}`);
    });
  }
}

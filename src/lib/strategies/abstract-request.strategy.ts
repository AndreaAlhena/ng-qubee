import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IStrategyCapabilities } from '../interfaces/strategy-capabilities.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Base class for request strategies
 *
 * Concentrates the glue every concrete strategy used to copy: the
 * resource-required guard, the `?`/`&` URL composition, and the default
 * positive-integer `validateLimit`. Concrete strategies override only
 * the parts that differ — the per-driver wire format goes into a single
 * `protected parts(state, options): string[]` method that returns the
 * ordered query-string segments the base then joins.
 *
 * Drivers that need a non-default `validateLimit` (e.g. NestJS, which
 * accepts `-1` as a fetch-all sentinel) override that method directly.
 */
export abstract class AbstractRequestStrategy implements IRequestStrategy {

  /**
   * Capability declaration for this driver
   *
   * Concrete strategies must provide a static, immutable capability map
   * so `NgQubeeService._assertCapability(...)` can read it.
   */
  public abstract readonly capabilities: IStrategyCapabilities;

  /**
   * Compose the full request URI from the given state
   *
   * Template method: validates the resource, computes the base path,
   * delegates the per-driver query-string segments to `parts(...)`, and
   * joins them with the conventional `?`/`&` separators.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   * @throws Error if the resource is not set
   */
  public buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string {
    this.assertResource(state);

    const segments = this.parts(state, options);

    return this.join(this.baseUri(state), segments);
  }

  /**
   * Validate that a limit value is acceptable for this driver
   *
   * Default policy: positive integer. Drivers that recognise a sentinel
   * (NestJS treats `-1` as "fetch all") override this method.
   *
   * @param limit - The limit value to validate
   * @throws {InvalidLimitError} If the value is not a positive integer
   */
  public validateLimit(limit: number): void {
    if (Number.isInteger(limit) && limit >= 1) {
      return;
    }

    throw new InvalidLimitError(limit);
  }

  /**
   * Per-driver query-string segments, in emission order
   *
   * Each entry is one `key=value` (or `key=v1&key=v2` for compound
   * params like PostgREST's `BTW`). Empty arrays are valid and produce
   * a URI containing only the resource path.
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns Ordered list of query-string fragments
   */
  protected abstract parts(state: IQueryBuilderState, options: QueryBuilderOptions): string[];

  /**
   * Throw if the resource is not set on the state
   *
   * Centralises the message that was previously copy-pasted across four
   * of the five concrete strategies.
   *
   * @param state - The current query builder state
   * @throws Error if `state.resource` is empty
   */
  protected assertResource(state: IQueryBuilderState): void {
    if (!state.resource) {
      throw new Error('Set the resource property BEFORE adding filters or calling the url() / get() methods');
    }
  }

  /**
   * Compute the base path (no query string)
   *
   * @param state - The current query builder state
   * @returns The base URI without the query separator (e.g. `/users` or `https://api.example.com/users`)
   */
  protected baseUri(state: IQueryBuilderState): string {
    return state.baseUrl ? `${state.baseUrl}/${state.resource}` : `/${state.resource}`;
  }

  /**
   * Glue the base URI and the per-driver query-string segments
   *
   * Returns the bare base when no segments were emitted (e.g. PostgREST
   * in RANGE mode with no filters), otherwise joins with `?` + `&`.
   *
   * @param base - The base URI from `_baseUri`
   * @param segments - The query-string fragments from `parts(...)`
   * @returns The full URI
   */
  protected join(base: string, segments: string[]): string {
    return segments.length ? `${base}?${segments.join('&')}` : base;
  }
}

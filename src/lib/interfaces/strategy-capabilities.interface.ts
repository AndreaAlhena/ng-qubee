/**
 * Capability flags declared by an `IRequestStrategy`
 *
 * Single source of truth for what a driver supports. Replaces the inline
 * `DriverEnum` allowlists previously scattered across `NgQubeeService`'s
 * `_assertDriver(...)` call sites.
 *
 * Adding a new driver means defining one of these objects on the new
 * strategy class — `NgQubeeService` does not need to be touched.
 */
export interface IStrategyCapabilities {
  /** Per-model field selection (e.g. JSON:API `fields[type]=col1,col2`) */
  readonly fields: boolean;

  /** Simple key-value filters (e.g. `filter.status=active`) */
  readonly filters: boolean;

  /** Related-resource includes (e.g. JSON:API/Spatie `include=author`) */
  readonly includes: boolean;

  /** Filters with explicit operators (e.g. NestJS `$gte`, PostgREST `gte.`) */
  readonly operatorFilters: boolean;

  /** Global full-text search via a single term (NestJS `search=…`) */
  readonly search: boolean;

  /** Flat column-list selection (NestJS / PostgREST `select=col1,col2`) */
  readonly select: boolean;

  /** Sort ordering on one or more fields */
  readonly sort: boolean;
}

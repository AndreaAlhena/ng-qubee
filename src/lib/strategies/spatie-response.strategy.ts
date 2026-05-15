import { AbstractFlatResponseStrategy } from './abstract-flat-response.strategy';

/**
 * Response strategy for the Spatie Query Builder driver
 *
 * Parses flat Laravel-style pagination responses (Spatie's Query Builder
 * is built on Laravel's pagination):
 * ```json
 * {
 *   "data": [...],
 *   "current_page": 1,
 *   "total": 100,
 *   "per_page": 15,
 *   "from": 1,
 *   "to": 15,
 *   ...
 * }
 * ```
 *
 * The traversal algorithm (flat `response[options.X]` lookups) is
 * inherited from `AbstractFlatResponseStrategy`; this class exists so
 * `DriverEnum.SPATIE` resolves to a distinct identity at the DI layer
 * even though the parsing logic is shared with the plain Laravel driver.
 *
 * @see https://spatie.be/docs/laravel-query-builder
 */
export class SpatieResponseStrategy extends AbstractFlatResponseStrategy {}

import { AbstractFlatResponseStrategy } from './abstract-flat-response.strategy';

/**
 * Response strategy for the Laravel (pagination-only) driver
 *
 * Parses flat Laravel pagination responses:
 * ```json
 * {
 *   "data": [...],
 *   "current_page": 1,
 *   "total": 100,
 *   "per_page": 15,
 *   "from": 1,
 *   "to": 15,
 *   "next_page_url": "...",
 *   "prev_page_url": "...",
 *   "first_page_url": "...",
 *   "last_page": 7,
 *   "last_page_url": "..."
 * }
 * ```
 *
 * The traversal algorithm (flat `response[options.X]` lookups) is
 * inherited from `AbstractFlatResponseStrategy`; this class exists so
 * `DriverEnum.LARAVEL` resolves to a distinct identity at the DI layer
 * even though the parsing logic is shared with Spatie.
 */
export class LaravelResponseStrategy extends AbstractFlatResponseStrategy {}

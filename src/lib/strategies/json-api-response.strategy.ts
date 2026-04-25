import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the JSON:API driver
 *
 * Parses JSON:API pagination responses:
 * ```json
 * {
 *   "data": [...],
 *   "meta": {
 *     "current-page": 1,
 *     "per-page": 10,
 *     "total": 100,
 *     "page-count": 10,
 *     "from": 1,
 *     "to": 10
 *   },
 *   "links": {
 *     "first": "url",
 *     "prev": "url",
 *     "next": "url",
 *     "last": "url"
 *   }
 * }
 * ```
 *
 * Default key paths are configured in `JsonApiResponseOptions`. The
 * traversal algorithm (dot-notation resolution + computed `from`/`to`) is
 * inherited from `AbstractDotPathResponseStrategy`; this class exists so
 * `DriverEnum.JSON_API` resolves to a distinct identity at the DI layer
 * even though the parsing logic is shared with NestJS.
 *
 * @see https://jsonapi.org/format/
 */
export class JsonApiResponseStrategy extends AbstractDotPathResponseStrategy {}

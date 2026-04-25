import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the NestJS (nestjs-paginate) driver
 *
 * Parses nested NestJS pagination responses:
 * ```json
 * {
 *   "data": [...],
 *   "meta": {
 *     "currentPage": 1,
 *     "totalItems": 100,
 *     "itemsPerPage": 10,
 *     "totalPages": 10
 *   },
 *   "links": {
 *     "first": "url",
 *     "previous": "url",
 *     "next": "url",
 *     "last": "url",
 *     "current": "url"
 *   }
 * }
 * ```
 *
 * Default key paths are configured in `NestjsResponseOptions`. The
 * traversal algorithm (dot-notation resolution + computed `from`/`to`) is
 * inherited from `AbstractDotPathResponseStrategy`; this class exists so
 * `DriverEnum.NESTJS` resolves to a distinct identity at the DI layer
 * even though the parsing logic is shared with JSON:API.
 *
 * @see https://github.com/ppetzold/nestjs-paginate
 */
export class NestjsResponseStrategy extends AbstractDotPathResponseStrategy {}

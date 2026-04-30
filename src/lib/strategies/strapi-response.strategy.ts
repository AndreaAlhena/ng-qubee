import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the Strapi driver
 *
 * Parses Strapi v4/v5 pagination responses:
 * ```json
 * {
 *   "data": [{ "id": 1, "documentId": "abc", "title": "Hello" }],
 *   "meta": {
 *     "pagination": {
 *       "page": 1,
 *       "pageSize": 10,
 *       "pageCount": 5,
 *       "total": 48
 *     }
 *   }
 * }
 * ```
 *
 * Default key paths are configured in `StrapiResponseOptions`. Strapi
 * does not include navigation links in the envelope, so `firstPageUrl`,
 * `prevPageUrl`, `nextPageUrl`, and `lastPageUrl` resolve to `undefined`
 * unless the consumer overrides their paths via `IPaginationConfig`. The
 * traversal algorithm (dot-notation resolution + computed `from`/`to`)
 * is inherited from `AbstractDotPathResponseStrategy`; this class exists
 * so `DriverEnum.STRAPI` resolves to a distinct identity at the DI
 * layer even though the parsing logic is shared with JSON:API and
 * NestJS.
 *
 * @see https://docs.strapi.io/dev-docs/api/rest/sort-pagination
 */
export class StrapiResponseStrategy extends AbstractDotPathResponseStrategy {}

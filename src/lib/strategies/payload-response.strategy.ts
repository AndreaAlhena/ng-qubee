import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the Payload CMS driver
 *
 * Parses Payload's paginated collection responses — the
 * `mongoose-paginate-v2` envelope, shared by many Express/Mongoose
 * backends:
 * ```json
 * {
 *   "docs": [{ "id": "abc123", "title": "Hello" }],
 *   "totalDocs": 48,
 *   "limit": 10,
 *   "totalPages": 5,
 *   "page": 2,
 *   "pagingCounter": 11,
 *   "hasPrevPage": true,
 *   "hasNextPage": true,
 *   "prevPage": 1,
 *   "nextPage": 3
 * }
 * ```
 *
 * Default key paths are configured in `PayloadResponseOptions`. The
 * envelope's `pagingCounter` is the 1-indexed offset of the first doc
 * on the page, so it maps straight onto `from`; `to` is computed from
 * `page` × `limit` (clamped to the total). `prevPage` / `nextPage` are
 * **page numbers**, not URLs, so the navigation-URL slots on
 * `PaginatedCollection` stay `undefined` unless the consumer overrides
 * their paths via `IPaginationConfig`. The traversal algorithm is
 * inherited from `AbstractDotPathResponseStrategy`; this class exists
 * so `DriverEnum.PAYLOAD` resolves to a distinct identity at the DI
 * layer even though the parsing logic is shared with JSON:API, NestJS,
 * Strapi, and PocketBase.
 *
 * @see https://payloadcms.com/docs/rest-api/overview
 */
export class PayloadResponseStrategy extends AbstractDotPathResponseStrategy {}

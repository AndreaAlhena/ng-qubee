import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the PocketBase driver
 *
 * Parses PocketBase records-list responses:
 * ```json
 * {
 *   "page": 1,
 *   "perPage": 30,
 *   "totalItems": 48,
 *   "totalPages": 2,
 *   "items": [{ "id": "abc123", "title": "Hello" }]
 * }
 * ```
 *
 * Default key paths are configured in `PocketbaseResponseOptions` —
 * all flat keys, resolved by the inherited dot-path traversal (a flat
 * key is just a one-segment path). PocketBase does not include
 * navigation links in the envelope, so `firstPageUrl`, `prevPageUrl`,
 * `nextPageUrl`, and `lastPageUrl` resolve to `undefined` unless the
 * consumer overrides their paths via `IPaginationConfig`; `from`/`to`
 * are computed from `page` × `perPage`. This class exists so
 * `DriverEnum.POCKETBASE` resolves to a distinct identity at the DI
 * layer even though the parsing logic is shared with JSON:API, NestJS,
 * and Strapi.
 *
 * When the request was sent with `skipTotal=1` (not emitted by this
 * driver), PocketBase reports `totalItems`/`totalPages` as `-1`;
 * override the paths or treat the values accordingly if you opt into
 * that server-side optimisation.
 *
 * @see https://pocketbase.io/docs/api-records/
 */
export class PocketbaseResponseStrategy extends AbstractDotPathResponseStrategy {}

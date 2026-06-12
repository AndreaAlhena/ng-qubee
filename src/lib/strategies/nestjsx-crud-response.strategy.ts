import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the @nestjsx/crud driver
 *
 * Parses @nestjsx/crud's `getMany` envelope:
 * ```json
 * {
 *   "data": [{ "id": 1, "name": "John" }],
 *   "count": 10,
 *   "total": 48,
 *   "page": 2,
 *   "pageCount": 5
 * }
 * ```
 *
 * Default key paths are configured in `NestjsxCrudResponseOptions`. The
 * envelope carries no `from`/`to` indices and no navigation links, so
 * `from`/`to` are computed from `page` × `count` by the inherited
 * traversal algorithm and the URL slots resolve to `undefined` unless
 * the consumer overrides their paths via `IPaginationConfig`.
 *
 * Note that `count` is the number of entities **on the current page**,
 * not the requested page size — on the last page of a result set the
 * derived `from`/`to` can underestimate. Consumers needing exact
 * indices should compute them from the requested limit instead.
 *
 * The dot-notation traversal is inherited from
 * `AbstractDotPathResponseStrategy`; this class exists so
 * `DriverEnum.NESTJSX_CRUD` resolves to a distinct identity at the DI
 * layer even though the parsing logic is shared with JSON:API, NestJS,
 * and Strapi.
 *
 * @see https://github.com/nestjsx/crud/wiki/Requests
 */
export class NestjsxCrudResponseStrategy extends AbstractDotPathResponseStrategy {}

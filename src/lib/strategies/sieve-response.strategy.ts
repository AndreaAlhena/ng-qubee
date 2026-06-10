import { AbstractDotPathResponseStrategy } from './abstract-dot-path-response.strategy';

/**
 * Response strategy for the Sieve (.NET) driver
 *
 * Sieve itself does not define a response envelope — it returns an
 * `IQueryable` that the ASP.NET developer wraps in a paging DTO of their
 * choosing. This strategy therefore ships a **sensible default mapping**
 * for the common hand-rolled `PagedResult<T>` shape:
 * ```json
 * {
 *   "data": [{ "id": 1, "title": "Hello" }],
 *   "page": 2,
 *   "pageSize": 10,
 *   "total": 48,
 *   "totalPages": 5
 * }
 * ```
 *
 * Every key path is configurable through `IConfig.response` (dot
 * notation supported), so any wrapper shape — `{ items, meta: {...} }`,
 * `{ results, pagination: {...} }` — can be mapped without subclassing.
 * Defaults are encoded in `SieveResponseOptions`. `from`/`to` are
 * computed from `page` × `pageSize` by the inherited traversal
 * algorithm, and the navigation-URL slots resolve to `undefined` unless
 * paths are provided.
 *
 * The dot-notation traversal is inherited from
 * `AbstractDotPathResponseStrategy`; this class exists so
 * `DriverEnum.SIEVE` resolves to a distinct identity at the DI layer.
 *
 * @see https://github.com/Biarity/Sieve
 */
export class SieveResponseStrategy extends AbstractDotPathResponseStrategy {}

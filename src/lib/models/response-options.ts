import { IPaginationConfig } from '../interfaces/pagination-config.interface';

/**
 * Resolved response field key names with defaults applied
 *
 * Maps logical pagination concepts to the actual key names
 * used in the API response. Unset values fall back to Laravel defaults.
 *
 * For NestJS responses, use dot-notation paths:
 * ```typescript
 * new ResponseOptions({
 *   currentPage: 'meta.currentPage',
 *   total: 'meta.totalItems'
 * });
 * ```
 */
export class ResponseOptions {
    public readonly currentPage: string;
    public readonly data: string;
    public readonly firstPageUrl: string;
    public readonly from: string;
    public readonly lastPage: string;
    public readonly lastPageUrl: string;
    public readonly nextPageUrl: string;
    public readonly path: string;
    public readonly perPage: string;
    public readonly prevPageUrl: string;
    public readonly to: string;
    public readonly total: string;

    constructor(options: IPaginationConfig) {
        this.currentPage = options.currentPage || 'current_page';
        this.data = options.data || 'data';
        this.firstPageUrl = options.firstPageUrl || 'first_page_url';
        this.from = options.from || 'from';
        this.lastPage = options.lastPage || 'last_page';
        this.lastPageUrl = options.lastPageUrl || 'last_page_url';
        this.nextPageUrl = options.nextPageUrl || 'next_page_url';
        this.path = options.path || 'path';
        this.perPage = options.perPage || 'per_page';
        this.prevPageUrl = options.prevPageUrl || 'prev_page_url';
        this.to = options.to || 'to';
        this.total = options.total || 'total';
    }
}

/**
 * Pre-configured ResponseOptions for the API Platform (Symfony) driver
 *
 * Uses dot-notation paths into the Hydra/JSON-LD envelope — the Hydra
 * keys contain colons but no dots, so `hydra:view.hydra:next` traverses
 * `response['hydra:view']['hydra:next']`. The `path` slot points at the
 * view's `@id`, which the strategy parses for the current page and page
 * size; `currentPage` / `perPage` / `lastPage` have no body field and
 * default to empty paths (derived from the view URLs instead).
 */
export class ApiPlatformResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'hydra:member',
            firstPageUrl: options.firstPageUrl || 'hydra:view.hydra:first',
            from: options.from || '',
            lastPage: options.lastPage || '',
            lastPageUrl: options.lastPageUrl || 'hydra:view.hydra:last',
            nextPageUrl: options.nextPageUrl || 'hydra:view.hydra:next',
            path: options.path || 'hydra:view.@id',
            perPage: options.perPage || '',
            prevPageUrl: options.prevPageUrl || 'hydra:view.hydra:previous',
            to: options.to || '',
            total: options.total || 'hydra:totalItems'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Directus driver
 *
 * The Directus envelope is `{ data, meta: { total_count, filter_count } }`
 * (with `meta=total_count,filter_count` requested — the request strategy
 * always emits it). `total` defaults to `meta.filter_count`, the count of
 * items matching the current filter; point it at `meta.total_count` via
 * `IPaginationConfig` for the unfiltered collection size. The envelope
 * names no current page, page size, or navigation URLs, so those paths
 * default to empty strings — the strategy falls back to page 1 and
 * derives `lastPage`/`from`/`to` only when the response provably holds
 * the whole filtered set. All paths are overridable (dot notation
 * supported) for custom wrappers that do include paging fields.
 */
export class DirectusResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || '',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || '',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'meta.filter_count'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Django REST Framework (DRF) driver
 *
 * DRF's `PageNumberPagination` envelope is `{ count, next, previous,
 * results }`, with no body field naming the current page, per-page, or
 * last-page. The strategy parses those from the `next` / `previous`
 * URLs, so the corresponding key paths default to empty strings; the
 * strategy ignores `options.currentPage`, `options.perPage`,
 * `options.lastPage`, `options.from`, `options.to`, `options.path`,
 * `options.firstPageUrl`, and `options.lastPageUrl`.
 */
export class DrfResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'results',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || '',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || 'next',
            path: options.path || '',
            perPage: options.perPage || '',
            prevPageUrl: options.prevPageUrl || 'previous',
            to: options.to || '',
            total: options.total || 'count'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the FeathersJS driver
 *
 * The Feathers adapter envelope is `{ total, limit, skip, data }` —
 * offset-based, with no page number and no navigation URLs. `perPage`
 * maps to the envelope's `limit` key and `total` to `total`; the
 * strategy derives `currentPage` / `lastPage` / `from` / `to` from
 * `skip` and `limit`, so the corresponding key paths default to empty
 * strings (the `skip` key itself is fixed by the envelope and read
 * directly by the strategy).
 */
export class FeathersResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || '',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || 'limit',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'total'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the JSON:API driver
 *
 * Uses dot-notation paths to access nested values in the JSON:API response format.
 * JSON:API meta key names vary by implementation; these defaults cover the most
 * common conventions and can be fully customised via `IPaginationConfig`.
 */
export class JsonApiResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'meta.current-page',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || 'links.first',
            from: options.from || 'meta.from',
            lastPage: options.lastPage || 'meta.page-count',
            lastPageUrl: options.lastPageUrl || 'links.last',
            nextPageUrl: options.nextPageUrl || 'links.next',
            path: options.path || 'path',
            perPage: options.perPage || 'meta.per-page',
            prevPageUrl: options.prevPageUrl || 'links.prev',
            to: options.to || 'meta.to',
            total: options.total || 'meta.total'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the json-server driver
 *
 * The json-server v1 envelope is `{ first, prev, next, last, pages,
 * items, data }`, where `first`/`prev`/`next`/`last` are **page
 * numbers**, not URLs — the strategy reads `prev`/`next` directly for
 * position derivation and leaves the URL slots `undefined`, so the
 * navigation-URL paths default to empty strings. `total` maps to
 * `items` and `lastPage` to `pages`; `currentPage` and `perPage` have
 * no body field and are derived.
 */
export class JsonServerResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || 'pages',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || '',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'items'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the NestJS driver
 *
 * Uses dot-notation paths to access nested values in the NestJS response format.
 */
export class NestjsResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'meta.currentPage',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || 'links.first',
            from: options.from || 'meta.from',
            lastPage: options.lastPage || 'meta.totalPages',
            lastPageUrl: options.lastPageUrl || 'links.last',
            nextPageUrl: options.nextPageUrl || 'links.next',
            path: options.path || 'path',
            perPage: options.perPage || 'meta.itemsPerPage',
            prevPageUrl: options.prevPageUrl || 'links.previous',
            to: options.to || 'meta.to',
            total: options.total || 'meta.totalItems'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the @nestjsx/crud driver
 *
 * The `getMany` envelope is flat: `{ data, count, total, page,
 * pageCount }`. `perPage` defaults to the `count` field — the number of
 * entities on the **current** page, which equals the requested limit on
 * every page except a partial last one. The envelope carries no
 * `from`/`to` indices and no navigation links, so those paths default to
 * empty strings (the strategy derives `from`/`to` and leaves the URLs
 * `undefined`); consumers can override any path via `IPaginationConfig`.
 */
export class NestjsxCrudResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'page',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || 'pageCount',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || 'count',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'total'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the OData v4 driver
 *
 * The OData collection envelope is `{ "@odata.count", "@odata.nextLink",
 * "value" }` — flat keys that contain **literal dots**, so the strategy
 * reads them with flat bracket access (never dot-path traversal). No body
 * field names the current page, per-page, or last-page; the strategy
 * derives those from the `@odata.nextLink` URL's `$skip` / `$top`
 * params, so the corresponding key paths default to empty strings and
 * are ignored.
 */
export class OdataResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || '',
            data: options.data || 'value',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || '',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '@odata.nextLink',
            path: options.path || '',
            perPage: options.perPage || '',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || '@odata.count'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Payload CMS driver
 *
 * The envelope is the flat `mongoose-paginate-v2` shape: `{ docs,
 * totalDocs, limit, totalPages, page, pagingCounter, hasPrevPage,
 * hasNextPage, prevPage, nextPage }`. `pagingCounter` is the 1-indexed
 * offset of the first doc on the page and maps onto `from`; `to` has no
 * body field and is derived. `prevPage`/`nextPage` are page numbers,
 * not URLs, so the navigation-URL paths default to empty strings. All
 * paths are overridable via `IPaginationConfig` (dot notation
 * supported) for custom wrappers.
 */
export class PayloadResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'page',
            data: options.data || 'docs',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || 'pagingCounter',
            lastPage: options.lastPage || 'totalPages',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || 'limit',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'totalDocs'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the PocketBase driver
 *
 * The records-list envelope is flat: `{ page, perPage, totalItems,
 * totalPages, items }`. The envelope carries no `from`/`to` indices and
 * no navigation links, so those paths default to empty strings (the
 * strategy derives `from`/`to` from `page` × `perPage` and leaves the
 * URLs `undefined`); all paths are overridable via `IPaginationConfig`
 * (dot notation supported) for custom wrappers.
 */
export class PocketbaseResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'page',
            data: options.data || 'items',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || 'totalPages',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || 'perPage',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'totalItems'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Sieve (.NET) driver
 *
 * Sieve defines no response envelope (it returns an `IQueryable` the
 * developer wraps), so these defaults target the common hand-rolled
 * `PagedResult<T>` shape: `{ data, page, pageSize, total, totalPages }`.
 * Every path is overridable via `IPaginationConfig` — dot notation is
 * supported, so nested wrappers (`meta.page`, `pagination.total`) map
 * without subclassing. `from`/`to` default to empty paths and are
 * derived; the navigation-URL slots resolve to `undefined` unless paths
 * are provided.
 */
export class SieveResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'page',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || '',
            from: options.from || '',
            lastPage: options.lastPage || 'totalPages',
            lastPageUrl: options.lastPageUrl || '',
            nextPageUrl: options.nextPageUrl || '',
            path: options.path || '',
            perPage: options.perPage || 'pageSize',
            prevPageUrl: options.prevPageUrl || '',
            to: options.to || '',
            total: options.total || 'total'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Spring Data REST driver
 *
 * Uses dot-notation paths into the HAL envelope: pagination metadata
 * lives under `page.*` and navigation links under `_links.*.href`.
 * `currentPage` points at the **0-indexed** `page.number`; the strategy
 * adds 1 when reading it. `data` defaults to plain `_embedded` because
 * the collection key underneath is the resource rel name (e.g.
 * `_embedded.users`) and cannot be known statically — the strategy picks
 * the first array inside; pin an exact path via `IPaginationConfig` when
 * needed. `from`/`to` default to empty paths and are derived.
 */
export class SpringResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'page.number',
            data: options.data || '_embedded',
            firstPageUrl: options.firstPageUrl || '_links.first.href',
            from: options.from || '',
            lastPage: options.lastPage || 'page.totalPages',
            lastPageUrl: options.lastPageUrl || '_links.last.href',
            nextPageUrl: options.nextPageUrl || '_links.next.href',
            path: options.path || '',
            perPage: options.perPage || 'page.size',
            prevPageUrl: options.prevPageUrl || '_links.prev.href',
            to: options.to || '',
            total: options.total || 'page.totalElements'
        });
    }
}

/**
 * Pre-configured ResponseOptions for the Strapi driver
 *
 * Uses dot-notation paths to access the nested `meta.pagination.*` envelope
 * Strapi v4/v5 emits. Strapi does not include navigation links by default,
 * so the URL paths point at locations that will resolve to `undefined`
 * unless the consumer overrides them.
 */
export class StrapiResponseOptions extends ResponseOptions {
    constructor(options: IPaginationConfig) {
        super({
            currentPage: options.currentPage || 'meta.pagination.page',
            data: options.data || 'data',
            firstPageUrl: options.firstPageUrl || 'links.first',
            from: options.from || 'meta.pagination.from',
            lastPage: options.lastPage || 'meta.pagination.pageCount',
            lastPageUrl: options.lastPageUrl || 'links.last',
            nextPageUrl: options.nextPageUrl || 'links.next',
            path: options.path || 'path',
            perPage: options.perPage || 'meta.pagination.pageSize',
            prevPageUrl: options.prevPageUrl || 'links.prev',
            to: options.to || 'meta.pagination.to',
            total: options.total || 'meta.pagination.total'
        });
    }
}

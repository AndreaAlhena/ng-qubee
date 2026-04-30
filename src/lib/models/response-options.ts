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

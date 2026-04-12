/**
 * Configuration interface for customizing response field key names
 *
 * Each property maps a logical pagination concept to the actual key name
 * used in the API response. The defaults depend on the selected driver.
 *
 * For the NestJS driver, dot-notation paths are used to access nested values
 * (e.g., 'meta.currentPage', 'links.next').
 */
export interface IPaginationConfig {
    /** Key for the current page number (Laravel: 'current_page', NestJS: 'meta.currentPage') */
    currentPage?: string;
    /** Key for the data array (default: 'data') */
    data?: string;
    /** Key for the first page URL (Laravel: 'first_page_url', NestJS: 'links.first') */
    firstPageUrl?: string;
    /** Key for the "from" item index (Laravel: 'from', NestJS: computed) */
    from?: string;
    /** Key for the last page number (Laravel: 'last_page', NestJS: 'meta.totalPages') */
    lastPage?: string;
    /** Key for the last page URL (Laravel: 'last_page_url', NestJS: 'links.last') */
    lastPageUrl?: string;
    /** Key for the next page URL (Laravel: 'next_page_url', NestJS: 'links.next') */
    nextPageUrl?: string;
    /** Key for the base path (Laravel only, default: 'path') */
    path?: string;
    /** Key for items per page (Laravel: 'per_page', NestJS: 'meta.itemsPerPage') */
    perPage?: string;
    /** Key for the previous page URL (Laravel: 'prev_page_url', NestJS: 'links.previous') */
    prevPageUrl?: string;
    /** Key for the "to" item index (Laravel: 'to', NestJS: computed) */
    to?: string;
    /** Key for the total item count (Laravel: 'total', NestJS: 'meta.totalItems') */
    total?: string;
}

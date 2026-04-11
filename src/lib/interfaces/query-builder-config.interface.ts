/**
 * Configuration interface for customizing request query parameter key names
 *
 * Each property maps a logical query concept to the actual query parameter name
 * used in the generated URI. The defaults depend on the selected driver.
 */
export interface IQueryBuilderConfig {
    /** Key for the appends parameter (Laravel only, default: 'append') */
    appends?: string;
    /** Key for the fields parameter (Laravel: 'fields', NestJS: 'select') */
    fields?: string;
    /** Key for the filters parameter (default: 'filter') */
    filters?: string;
    /** Key for the includes parameter (Laravel only, default: 'include') */
    includes?: string;
    /** Key for the limit parameter (default: 'limit') */
    limit?: string;
    /** Key for the page parameter (default: 'page') */
    page?: string;
    /** Key for the search parameter (NestJS only, default: 'search') */
    search?: string;
    /** Key for the select parameter (NestJS only, default: 'select') */
    select?: string;
    /** Key for the sort parameter (Laravel: 'sort', NestJS: 'sortBy') */
    sort?: string;
    /** Key for the sortBy parameter (NestJS only, default: 'sortBy') */
    sortBy?: string;
}

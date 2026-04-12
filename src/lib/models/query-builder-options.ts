import { IQueryBuilderConfig } from '../interfaces/query-builder-config.interface';

/**
 * Resolved query parameter key names with defaults applied
 *
 * Maps logical query concepts to the actual query parameter names
 * used in the generated URI. Unset values fall back to defaults.
 */
export class QueryBuilderOptions {
    public readonly appends: string;
    public readonly fields: string;
    public readonly filters: string;
    public readonly includes: string;
    public readonly limit: string;
    public readonly page: string;
    public readonly search: string;
    public readonly select: string;
    public readonly sort: string;
    public readonly sortBy: string;

    constructor(options: IQueryBuilderConfig) {
        this.appends = options.appends || 'append';
        this.fields = options.fields || 'fields';
        this.filters = options.filters || 'filter';
        this.includes = options.includes || 'include';
        this.limit = options.limit || 'limit';
        this.page = options.page || 'page';
        this.search = options.search || 'search';
        this.select = options.select || 'select';
        this.sort = options.sort || 'sort';
        this.sortBy = options.sortBy || 'sortBy';
    }
}

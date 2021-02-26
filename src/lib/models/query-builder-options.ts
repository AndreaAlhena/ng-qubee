import { IQueryBuilderConfig } from '../interfaces/query-builder-config.interface';

export class QueryBuilderOptions {
    public readonly appends: string;
    public readonly fields: string;
    public readonly filters: string;
    public readonly includes: string;
    public readonly limit: string;
    public readonly page: string;
    public readonly sort: string;

    constructor(options: IQueryBuilderConfig) {
        this.appends = options.appends || 'append';
        this.fields = options.fields || 'fields';
        this.filters = options.filters || 'filter';
        this.includes = options.includes || 'includes';
        this.limit = options.limit || 'limit';
        this.page = options.page || 'page';
        this.sort = options.sort || 'sort';
    }
}
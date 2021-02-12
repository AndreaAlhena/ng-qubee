import { IQueryParams } from '../interfaces/query-params.interface';

export class QueryBuilderOptions {
    public readonly appends: string;
    public readonly fields: string;
    public readonly filters: string;
    public readonly includes: string;
    public readonly limit: string;
    public readonly page: string;
    public readonly sort: string;

    constructor(options: IQueryParams) {
        this.appends = options.appends || 'append';
        this.fields = options.fields || 'fields';
        this.filters = options.filters || 'filter';
        this.includes = options.includes || 'includes';
        this.limit = options.limit || 'limit';
        this.page = options.page || 'page';
        this.sort = options.sort || 'sort';
    }
}
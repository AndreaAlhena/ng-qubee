import { IPaginationConfig } from '../interfaces/pagination-config.interface';
import { IQueryBuilderConfig } from '../interfaces/query-builder-config.interface';

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
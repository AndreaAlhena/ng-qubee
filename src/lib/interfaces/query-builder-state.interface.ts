import { IFields } from './fields.interface';
import { IFilters } from './filters.interface';
import { IOperatorFilter } from './operator-filter.interface';
import { ISort } from './sort.interface';

/**
 * Represents the complete query builder state
 *
 * This is a superset that covers the needs of all drivers.
 * Each driver reads only the fields it needs from this state.
 */
export interface IQueryBuilderState {
    /** The base URL to prepend to generated URIs */
    baseUrl: string;
    /** Per-model field selection (Spatie only) */
    fields: IFields;
    /** Simple key-value filters (Spatie and NestJS) */
    filters: IFilters;
    /** Related models to include (Spatie only) */
    includes: string[];
    /** Number of items per page (all drivers) */
    limit: number;
    /** Filters with explicit operators (NestJS only) */
    operatorFilters: IOperatorFilter[];
    /** Current page number (all drivers) */
    page: number;
    /** The API resource name for URI generation (all drivers) */
    resource: string;
    /** Full-text search term (NestJS only) */
    search: string;
    /** Flat field selection (NestJS only) */
    select: string[];
    /** Sort configurations (Spatie and NestJS) */
    sorts: ISort[];
}

import { IFields } from './fields.interface';
import { IFilters } from './filters.interface';
import { IOperatorFilter } from './operator-filter.interface';
import { ISort } from './sort.interface';

/**
 * Represents the complete query builder state
 *
 * This is a superset that covers the needs of both Laravel and NestJS drivers.
 * Each driver reads only the fields it needs from this state.
 */
export interface IQueryBuilderState {
    /** The base URL to prepend to generated URIs */
    baseUrl: string;
    /** Per-model field selection (Laravel only) */
    fields: IFields;
    /** Simple key-value filters (both drivers) */
    filters: IFilters;
    /** Related models to include (Laravel only) */
    includes: string[];
    /** Number of items per page (both drivers) */
    limit: number;
    /** The model/resource name for URI generation (both drivers) */
    model: string;
    /** Filters with explicit operators (NestJS only) */
    operatorFilters: IOperatorFilter[];
    /** Current page number (both drivers) */
    page: number;
    /** Full-text search term (NestJS only) */
    search: string;
    /** Flat field selection (NestJS only) */
    select: string[];
    /** Sort configurations (both drivers) */
    sorts: ISort[];
}

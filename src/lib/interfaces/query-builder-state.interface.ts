import { IFields } from "./fields.interface";
import { IFilters } from "./filters.interface";
import { ISort } from "./sort.interface";

export interface IQueryBuilderState {
    baseUrl: string;
    fields: IFields;
    filters: IFilters;
    includes: string[];
    limit: number;
    model: string;
    page: number,
    sort: ISort;
    uri: string;
}
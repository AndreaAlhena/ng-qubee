import { SortEnum } from "../enums/sort.enum";

export interface ISort {
    field: string;
    order: SortEnum
}
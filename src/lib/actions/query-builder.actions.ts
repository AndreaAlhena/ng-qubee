
// Interfaces
import { createAction } from "@reduxjs/toolkit";
import { IFields } from "../interfaces/fields.interface";
import { IFilters } from "../interfaces/filters.interface";
import { ISort } from "../interfaces/sort.interface";

export const addFields = createAction<{fields: IFields}>('[Query Buillder] Add Fields');

export const addFilters = createAction<{filters: IFilters}>('[Query Buillder] Add Filters');

export const addIncludes = createAction<{includes: string[]}>('[Query Buillder] Add Includes');

export const addSorts = createAction<{sorts: ISort}>('[Query Buillder] Add Sorts');

export const deleteFields = createAction<{fields: string[]}>('[Query Buillder] Delete Fields');

export const deleteFilters = createAction<{filters: string[]}>('[Query Buillder] Delete Filters');

export const deleteIncludes = createAction<{includes: string[]}>('[Query Buillder] Delete Includes');

export const deleteSorts = createAction<{sorts: string[]}>('[Query Buillder] Delete Sorts');

export const reset = createAction('[Query Builder] Reset');

export const setBaseUrl = createAction<{baseUrl: string}>('[Query Buillder] Set Base URL');

export const setLimit = createAction<{limit: number}>('[Query Buillder] Set Limit');

export const setModel = createAction<{model: string}>('[Query Builder] Set Model');

export const setPage = createAction<{page: number}>('[Query Builder] Set Page');

export const updateUri = createAction<{uri: string}>('[Query Builder] Update URI');
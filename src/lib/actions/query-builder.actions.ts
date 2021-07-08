import { createAction, props } from "@ngrx/store";

// Interfaces
import { IFields } from "../interfaces/fields.interface";
import { IFilters } from "../interfaces/filters.interface";
import { ISort } from "../interfaces/sort.interface";

export const addFields = createAction(
    '[Query Buillder] Add Fields',
    props<{fields: IFields}>()
);

export const addFilters = createAction(
    '[Query Buillder] Add Filters',
    props<{filters: IFilters}>()
);

export const addIncludes = createAction(
    '[Query Buillder] Add Includes',
    props<{includes: string[]}>()
);

export const addSorts = createAction(
    '[Query Buillder] Add Sorts',
    props<{sorts: ISort}>()
);

export const deleteFields = createAction(
    '[Query Buillder] Delete Fields',
    props<{fields: string[]}>()
);

export const deleteFilters = createAction(
    '[Query Buillder] Delete Filters',
    props<{filters: string[]}>()
);

export const deleteIncludes = createAction(
    '[Query Buillder] Delete Includes',
    props<{includes: string[]}>()
);

export const deleteSorts = createAction(
    '[Query Buillder] Delete Sorts',
    props<{sorts: string[]}>()
);

export const reset = createAction('[Query Builder] Reset');

export const setBaseUrl = createAction(
    '[Query Buillder] Set Base URL',
    props<{baseUrl: string}>()
);

export const setLimit = createAction(
    '[Query Buillder] Set Limit',
    props<{limit: number}>()
);

export const setModel = createAction(
    '[Query Builder] Set Model',
    props<{model: string}>()
);

export const setPage = createAction(
    '[Query Builder] Set Page',
    props<{page: number}>()
);

export const updateUri = createAction(
    '[Query Builder] Update URI',
    props<{uri: string}>()
);
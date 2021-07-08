import { createSelector } from "@ngrx/store";
import { INestState } from "../interfaces/nest-state.interface";
import { IQueryBuilderState } from "../interfaces/query-builder-state.interface";

export const selectNest = (state: INestState) => state.nest;

export const selectUri = createSelector(selectNest, (state: IQueryBuilderState) => state.uri);
import { Action, createReducer, on, State } from "@ngrx/store";
import * as QueryBuilderActions from "../actions/query-builder.actions";
import { INestState } from "../interfaces/nest-state.interface";
import { IQueryBuilderState } from "../interfaces/query-builder-state.interface";

const initialState: IQueryBuilderState = {
    baseUrl: '',
    fields: {},
    filters: {},
    includes: [],
    limit: 15,
    model: '',
    page: 1,
    sort: {},
    uri: ''
};

const _queryBuilderReducer = createReducer(
    initialState,
    on(QueryBuilderActions.addFields, (state, {fields}) => ({...state, fields: {...state.fields, ...fields}})),
    on(QueryBuilderActions.addFilters, (state, {filters}) => ({...state, filters: {...state.filters, ...filters}})),
    on(QueryBuilderActions.addIncludes, (state, {includes}) => ({...state, includes: [...state.includes, ...includes]})),
    on(QueryBuilderActions.addSorts, (state, {sorts}) => ({...state, sort: {...state.sort, ...sorts}})),

    on(QueryBuilderActions.deleteFields, (state, {fields}) => {
        const f = Object.assign({}, state.fields);

        Object.keys(fields).forEach(k => {
            if ( !(k in state.fields) ) {
                return;
            }

            f[k] = state.fields[k].filter(v => !fields[k].includes(v));
        });
            
        return {
            ...state,
            fields: f
        };
    }),

    on(QueryBuilderActions.deleteFilters, (state, {filters}) => {
        const f = Object.assign({}, state.filters);

        filters.forEach(k => delete f[k]);
        
        return {
            ...state,
            filters: f
        };
    }),

    on(QueryBuilderActions.deleteIncludes, (state, {includes}) => {
        return {
            ...state,
            includes: state.includes.filter(v => !includes.includes(v))
        };
    }),

    on(QueryBuilderActions.deleteSorts, (state, {sorts}) => {
        const s = Object.assign({}, state.sort);

        sorts.forEach(v => delete s[v]);
        
        return {
            ...state,
            sort: s
        };
    }),

    on(QueryBuilderActions.reset, state => initialState),

    on(QueryBuilderActions.setBaseUrl, (state, {baseUrl}) => ({...state, baseUrl})),
    on(QueryBuilderActions.setLimit, (state, {limit}) => ({...state, limit})),
    on(QueryBuilderActions.setModel, (state, {model}) => ({...state, model})),
    on(QueryBuilderActions.setPage, (state, {page}) => ({...state, page})),
    on(QueryBuilderActions.updateUri, (state, {uri}) => ({...state, uri}))
);

export function queryBuilderReducer(state: IQueryBuilderState | undefined, action: Action) {
    return _queryBuilderReducer(state, action);
}
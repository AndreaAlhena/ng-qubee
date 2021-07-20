import { createReducer } from "@reduxjs/toolkit";
import * as QueryBuilderActions from "../actions/query-builder.actions";
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

export const queryBuilderReducer = createReducer(
    initialState,
    builder => {
        builder.addCase(QueryBuilderActions.addFields, (state, {payload: {fields}}) => ({...state, fields: {...state.fields, ...fields}})),
        builder.addCase(QueryBuilderActions.addFilters, (state, {payload: {filters}}) => ({...state, filters: {...state.filters, ...filters}})),
        builder.addCase(QueryBuilderActions.addIncludes, (state, {payload: {includes}}) => ({...state, includes: [...state.includes, ...includes]})),
        builder.addCase(QueryBuilderActions.addSorts, (state, {payload: {sorts}}) => ({...state, sort: {...state.sort, ...sorts}})),
    
        builder.addCase(QueryBuilderActions.deleteFields, (state, {payload: {fields}}) => {
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
    
        builder.addCase(QueryBuilderActions.deleteFilters, (state, {payload: {filters}}) => {
            const f = Object.assign({}, state.filters);
    
            filters.forEach(k => delete f[k]);
            
            return {
                ...state,
                filters: f
            };
        }),
    
        builder.addCase(QueryBuilderActions.deleteIncludes, (state, {payload: {includes}}) => {
            return {
                ...state,
                includes: state.includes.filter(v => !includes.includes(v))
            };
        }),
    
        builder.addCase(QueryBuilderActions.deleteSorts, (state, {payload: {sorts}}) => {
            const s = Object.assign({}, state.sort);
    
            sorts.forEach(v => delete s[v]);
            
            return {
                ...state,
                sort: s
            };
        }),
    
        builder.addCase(QueryBuilderActions.reset, state => initialState),
    
        builder.addCase(QueryBuilderActions.setBaseUrl, (state, {payload: {baseUrl}}) => ({...state, baseUrl})),
        builder.addCase(QueryBuilderActions.setLimit, (state, {payload: {limit}}) => ({...state, limit})),
        builder.addCase(QueryBuilderActions.setModel, (state, {payload: {model}}) => ({...state, model})),
        builder.addCase(QueryBuilderActions.setPage, (state, {payload: {page}}) => ({...state, page})),
        builder.addCase(QueryBuilderActions.updateUri, (state, {payload: {uri}}) => ({...state, uri}))
    }
);
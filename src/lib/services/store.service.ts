import { Injectable } from '@angular/core';
import { Action, combineReducers, Store } from 'redux';
import { INestState } from '../interfaces/nest-state.interface';
import { queryBuilderReducer } from '../reducers/query-builder.reducer';
import { configureStore } from '@reduxjs/toolkit';

@Injectable()
export class StoreService {

  private _store: Store<INestState>;

  constructor() {
    this._store = configureStore({
      reducer: combineReducers({nest: queryBuilderReducer})
    });
  }

  get state(): INestState {
    return this._store.getState();
  }

  public dispatch(action: Action): void {
    this._store.dispatch(action);
  }

  public subscribe(listener: () => void) {
    this._store.subscribe(listener);
  }
}

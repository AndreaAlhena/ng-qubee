import { Injectable } from '@angular/core';
import { Action, combineReducers, createStore, Store } from 'redux';
import { INestState } from '../interfaces/nest-state.interface';
import { queryBuilderReducer } from '../reducers/query-builder.reducer';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private _store: Store<INestState>;

  constructor() {
    this._store = createStore(combineReducers({nest: queryBuilderReducer}));
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

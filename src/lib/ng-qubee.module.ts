import { ModuleWithProviders, NgModule } from '@angular/core';
import { Store, StoreModule } from '@ngrx/store';
import { NgQubeeService } from './ng-qubee.service';
import { IConfig } from './interfaces/config.interface';
import { queryBuilderReducer } from './reducers/query-builder.reducer';
import { PaginationService } from './services/pagination.service';
import { INestState } from './interfaces/nest-state.interface';

// @dynamic
@NgModule({
  imports: [
    StoreModule.forRoot({nest: queryBuilderReducer})
  ],
  providers: [{
    deps: [Store],
    provide: NgQubeeService,
    useFactory: (store: Store<INestState>) => new NgQubeeService(store, {})
  }]
})
export class NgQubeeModule {
  private static _config: IConfig = {};

  public static forRoot(config: IConfig): ModuleWithProviders<NgQubeeModule> {
    return {
      ngModule: NgQubeeModule,
      providers: [{
        deps: [Store],
        provide: NgQubeeService,
        useFactory: (store: Store<INestState>) =>
          new NgQubeeService(store, Object.assign({}, this._config.request, config.request))
      }, {
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(Object.assign({}, this._config.response, config.response))
      }]
    };
  }
}

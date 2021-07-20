import { ModuleWithProviders, NgModule } from '@angular/core';
import { NgQubeeService } from './ng-qubee.service';
import { IConfig } from './interfaces/config.interface';
import { PaginationService } from './services/pagination.service';
import { StoreService } from './services/store.service';

// @dynamic
@NgModule({
  providers: [{
    deps: [StoreService],
    provide: NgQubeeService,
    useFactory: (store: StoreService) => new NgQubeeService(store, {})
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
        useFactory: (store: StoreService) =>
          new NgQubeeService(store, Object.assign({}, this._config.request, config.request))
      }, {
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(Object.assign({}, this._config.response, config.response))
      }]
    };
  }
}

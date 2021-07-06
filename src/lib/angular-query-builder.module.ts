import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularQueryBuilderService } from './angular-query-builder.service';
import { IConfig } from './interfaces/config.interface';
import { IQueryBuilderConfig } from './interfaces/query-builder-config.interface';
import { PaginationService } from './services/pagination.service';

@NgModule({
  providers: [{
    provide: AngularQueryBuilderService,
    useFactory: () => new AngularQueryBuilderService({})
  }]
})
export class AngularQueryBuilderModule {
  private static _config: IConfig = {};

  private static _getModuleWithProviders(config: IConfig) {
    return {
      ngModule: AngularQueryBuilderModule,
      providers: [{
        provide: AngularQueryBuilderService,
        useFactory: () =>
          new AngularQueryBuilderService(Object.assign({}, this._config.request, config.request))
      }, {
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(Object.assign({}, this._config.response, config.response))
      }]
    };
  };

  public static forChild(config: IConfig): ModuleWithProviders<AngularQueryBuilderModule> {
    return this._getModuleWithProviders(config);
  }

  public static forRoot(config: IConfig): ModuleWithProviders<AngularQueryBuilderModule> {
    this._config = config;
    return this._getModuleWithProviders(config);
  }
}

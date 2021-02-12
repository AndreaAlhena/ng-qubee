import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularQueryBuilderService } from './angular-query-builder.service';
import { IQueryParams } from './interfaces/query-params.interface';

@NgModule({
  providers: [{
    provide: AngularQueryBuilderService,
    useFactory: () => new AngularQueryBuilderService({})
  }]
})
export class AngularQueryBuilderModule {
  private static _config: IQueryParams = {};

  public static forChild(config: IQueryParams): ModuleWithProviders<AngularQueryBuilderModule> {
    return {
      ngModule: AngularQueryBuilderModule,
      providers: [{
        provide: AngularQueryBuilderService,
        useFactory: () =>
          new AngularQueryBuilderService(Object.assign({}, this._config, config))
      }]
    };
  }

  public static forRoot(config: IQueryParams): ModuleWithProviders<AngularQueryBuilderModule> {
    this._config = config;

    return {
      ngModule: AngularQueryBuilderModule,
      providers: [{
        provide: AngularQueryBuilderService,
        useFactory: () =>
          new AngularQueryBuilderService(Object.assign({}, this._config, config))
      }]
    };
  }
}

import { ModuleWithProviders, NgModule } from '@angular/core';

import { IConfig } from './interfaces/config.interface';
import { buildNgQubeeProviders } from './provide-ngqubee';

// @dynamic
@NgModule({})
export class NgQubeeModule {

  /**
   * Configure NgQubee for the root module
   *
   * @param config - Configuration object with driver, and optional request and response settings
   * @returns Module with providers configured for the specified driver
   */
  public static forRoot(config: IConfig): ModuleWithProviders<NgQubeeModule> {
    return {
      ngModule: NgQubeeModule,
      providers: buildNgQubeeProviders(config)
    };
  }
}

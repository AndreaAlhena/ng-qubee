import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { IConfig } from "./interfaces/config.interface";
import { StoreService } from "./services/store.service";
import { NgQubeeService } from "./ng-qubee.service";
import { PaginationService } from "./services/pagination.service";

/**
 * Sets up providers necessary to enable `NgQubee` functionality for the application.
 *
 * @usageNotes
 *
 * Basic example of how you can add NgQubee to your application:
 * ```
 * const config = {};
 * 
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgQubee(config)]
 * });
 * ```
 *
 * @publicApi
 * @param config Configuration object compliant to the IConfig interface
 * @returns A set of providers to setup NgQubee
 */
export function provideNgQubee(config: IConfig = {}): EnvironmentProviders {
    return makeEnvironmentProviders([{
        deps: [StoreService],
        provide: NgQubeeService,
        useFactory: (store: StoreService) =>
          new NgQubeeService(store, Object.assign({}, config.request))
      }, {
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(Object.assign({}, config.response))
      }]);
  }
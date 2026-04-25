import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { DRIVERS } from './drivers/driver-registry';
import { PaginationModeEnum } from './enums/pagination-mode.enum';
import { IConfig } from './interfaces/config.interface';
import { QueryBuilderOptions } from './models/query-builder-options';
import { NestService } from './services/nest.service';
import { NgQubeeService } from './services/ng-qubee.service';
import { PaginationService } from './services/pagination.service';
import {
  NG_QUBEE_DRIVER,
  NG_QUBEE_REQUEST_OPTIONS,
  NG_QUBEE_REQUEST_STRATEGY,
  NG_QUBEE_RESPONSE_OPTIONS,
  NG_QUBEE_RESPONSE_STRATEGY
} from './tokens/ng-qubee.tokens';

/**
 * Build the core provider list shared by `provideNgQubee()` and
 * `NgQubeeModule.forRoot()`
 *
 * Looks up the driver definition from the registry and calls its three
 * factories — request strategy, response strategy, response options.
 * Adding a driver means adding one entry to `DRIVERS`; this function
 * does not change.
 *
 * Exposes the driver, strategies, and options via injection tokens so that
 * consumers can request a component-scoped instance of the services through
 * `provideNgQubeeInstance()`.
 *
 * @param config - Configuration object compliant to the IConfig interface
 * @returns An array of Providers for the environment injector
 */
export function buildNgQubeeProviders(config: IConfig): Provider[] {
  const driver = config.driver;
  const paginationMode = config.pagination ?? PaginationModeEnum.QUERY;
  const definition = DRIVERS[driver];

  const requestOptions = new QueryBuilderOptions(Object.assign({}, config.request));
  const responseOptions = definition.createResponseOptions(Object.assign({}, config.response));

  return [
    { provide: NG_QUBEE_DRIVER, useValue: driver },
    { provide: NG_QUBEE_REQUEST_STRATEGY, useValue: definition.createRequestStrategy(paginationMode) },
    { provide: NG_QUBEE_REQUEST_OPTIONS, useValue: requestOptions },
    { provide: NG_QUBEE_RESPONSE_STRATEGY, useValue: definition.createResponseStrategy() },
    { provide: NG_QUBEE_RESPONSE_OPTIONS, useValue: responseOptions },
    NestService,
    NgQubeeService,
    PaginationService
  ];
}

/**
 * Sets up providers necessary to enable `NgQubee` functionality for the application.
 *
 * @usageNotes
 *
 * Basic example with the Laravel driver:
 * ```
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgQubee({ driver: DriverEnum.LARAVEL })]
 * });
 * ```
 *
 * Spatie driver example:
 * ```
 * import { DriverEnum } from 'ng-qubee';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
 * });
 * ```
 *
 * JSON:API driver example:
 * ```
 * import { DriverEnum } from 'ng-qubee';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgQubee({ driver: DriverEnum.JSON_API })]
 * });
 * ```
 *
 * NestJS driver example:
 * ```
 * import { DriverEnum } from 'ng-qubee';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgQubee({ driver: DriverEnum.NESTJS })]
 * });
 * ```
 *
 * @publicApi
 * @param config - Configuration object compliant to the IConfig interface
 * @returns A set of providers to setup NgQubee
 */
export function provideNgQubee(config: IConfig): EnvironmentProviders {
  return makeEnvironmentProviders(buildNgQubeeProviders(config));
}

/**
 * Providers for a component-scoped NgQubee instance
 *
 * Use this inside a standalone component's `providers: [...]` to get a
 * dedicated `NgQubeeService` (and its `NestService` / `PaginationService`
 * collaborators) whose query-builder and pagination state does not bleed
 * with the app-wide shared instance provided by `provideNgQubee()`.
 *
 * @usageNotes
 *
 * ```
 * @Component({
 *   standalone: true,
 *   providers: [...provideNgQubeeInstance()]
 * })
 * export class MyFeatureComponent {
 *   constructor(private _qb: NgQubeeService) {}
 * }
 * ```
 *
 * The driver, strategies, and options are inherited from the environment
 * injector (`provideNgQubee()` at root), so only the service instances are
 * re-created at the component level.
 *
 * @publicApi
 * @returns A provider array to spread into a component's `providers`
 */
export function provideNgQubeeInstance(): Provider[] {
  return [NestService, NgQubeeService, PaginationService];
}

import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { DriverEnum } from './enums/driver.enum';
import { PaginationModeEnum } from './enums/pagination-mode.enum';
import { IConfig } from './interfaces/config.interface';
import { IPaginationConfig } from './interfaces/pagination-config.interface';
import { IRequestStrategy } from './interfaces/request-strategy.interface';
import { IResponseStrategy } from './interfaces/response-strategy.interface';
import { QueryBuilderOptions } from './models/query-builder-options';
import { JsonApiResponseOptions, NestjsResponseOptions, ResponseOptions } from './models/response-options';
import { NestService } from './services/nest.service';
import { NgQubeeService } from './services/ng-qubee.service';
import { PaginationService } from './services/pagination.service';
import { JsonApiRequestStrategy } from './strategies/json-api-request.strategy';
import { JsonApiResponseStrategy } from './strategies/json-api-response.strategy';
import { LaravelRequestStrategy } from './strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from './strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from './strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from './strategies/nestjs-response.strategy';
import { PostgrestRequestStrategy } from './strategies/postgrest-request.strategy';
import { PostgrestResponseStrategy } from './strategies/postgrest-response.strategy';
import { SpatieRequestStrategy } from './strategies/spatie-request.strategy';
import { SpatieResponseStrategy } from './strategies/spatie-response.strategy';
import {
  NG_QUBEE_DRIVER,
  NG_QUBEE_REQUEST_OPTIONS,
  NG_QUBEE_REQUEST_STRATEGY,
  NG_QUBEE_RESPONSE_OPTIONS,
  NG_QUBEE_RESPONSE_STRATEGY
} from './tokens/ng-qubee.tokens';

/**
 * Resolve the request strategy instance for the given driver
 *
 * @param driver - The pagination driver
 * @param paginationMode - Wire-level pagination mechanism. Currently only
 * honoured by the PostgREST strategy; ignored by the other drivers.
 * @returns The corresponding request strategy
 */
function resolveRequestStrategy(driver: DriverEnum, paginationMode: PaginationModeEnum): IRequestStrategy {
  switch (driver) {
    case DriverEnum.JSON_API:
      return new JsonApiRequestStrategy();
    case DriverEnum.NESTJS:
      return new NestjsRequestStrategy();
    case DriverEnum.POSTGREST:
      return new PostgrestRequestStrategy(paginationMode);
    case DriverEnum.SPATIE:
      return new SpatieRequestStrategy();
    case DriverEnum.LARAVEL:
      return new LaravelRequestStrategy();
  }
}

/**
 * Resolve the response strategy instance for the given driver
 *
 * @param driver - The pagination driver
 * @returns The corresponding response strategy
 */
function resolveResponseStrategy(driver: DriverEnum): IResponseStrategy {
  switch (driver) {
    case DriverEnum.JSON_API:
      return new JsonApiResponseStrategy();
    case DriverEnum.NESTJS:
      return new NestjsResponseStrategy();
    case DriverEnum.POSTGREST:
      return new PostgrestResponseStrategy();
    case DriverEnum.SPATIE:
      return new SpatieResponseStrategy();
    case DriverEnum.LARAVEL:
      return new LaravelResponseStrategy();
  }
}

/**
 * Resolve the driver-specific `ResponseOptions` instance
 *
 * @param driver - The pagination driver
 * @param responseConfig - User-supplied response key overrides
 * @returns A pre-built ResponseOptions (or driver-specific subclass)
 */
function resolveResponseOptions(driver: DriverEnum, responseConfig: IPaginationConfig): ResponseOptions {
  if (driver === DriverEnum.JSON_API) {
    return new JsonApiResponseOptions(responseConfig);
  }

  if (driver === DriverEnum.NESTJS) {
    return new NestjsResponseOptions(responseConfig);
  }

  return new ResponseOptions(responseConfig);
}

/**
 * Build the core provider list shared by `provideNgQubee()` and
 * `NgQubeeModule.forRoot()`
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
  const requestOptions = new QueryBuilderOptions(Object.assign({}, config.request));
  const responseOptions = resolveResponseOptions(driver, Object.assign({}, config.response));

  return [
    { provide: NG_QUBEE_DRIVER, useValue: driver },
    { provide: NG_QUBEE_REQUEST_STRATEGY, useValue: resolveRequestStrategy(driver, paginationMode) },
    { provide: NG_QUBEE_REQUEST_OPTIONS, useValue: requestOptions },
    { provide: NG_QUBEE_RESPONSE_STRATEGY, useValue: resolveResponseStrategy(driver) },
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

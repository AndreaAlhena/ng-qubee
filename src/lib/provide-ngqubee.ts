import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { DriverEnum } from './enums/driver.enum';
import { IConfig } from './interfaces/config.interface';
import { IRequestStrategy } from './interfaces/request-strategy.interface';
import { IResponseStrategy } from './interfaces/response-strategy.interface';
import { JsonApiResponseOptions, NestjsResponseOptions } from './models/response-options';
import { NgQubeeService } from './services/ng-qubee.service';
import { NestService } from './services/nest.service';
import { PaginationService } from './services/pagination.service';
import { JsonApiRequestStrategy } from './strategies/json-api-request.strategy';
import { JsonApiResponseStrategy } from './strategies/json-api-response.strategy';
import { LaravelRequestStrategy } from './strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from './strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from './strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from './strategies/nestjs-response.strategy';
import { SpatieRequestStrategy } from './strategies/spatie-request.strategy';
import { SpatieResponseStrategy } from './strategies/spatie-response.strategy';

/**
 * Resolve the request strategy instance for the given driver
 *
 * @param driver - The pagination driver
 * @returns The corresponding request strategy
 */
function resolveRequestStrategy(driver: DriverEnum): IRequestStrategy {
  switch (driver) {
    case DriverEnum.JSON_API:
      return new JsonApiRequestStrategy();
    case DriverEnum.NESTJS:
      return new NestjsRequestStrategy();
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
    case DriverEnum.SPATIE:
      return new SpatieResponseStrategy();
    case DriverEnum.LARAVEL:
      return new LaravelResponseStrategy();
  }
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
  const driver = config.driver;
  const requestStrategy = resolveRequestStrategy(driver);
  const responseStrategy = resolveResponseStrategy(driver);

  return makeEnvironmentProviders([
    {
      provide: NestService,
      useClass: NestService
    },
    {
      deps: [NestService],
      provide: NgQubeeService,
      useFactory: (nestService: NestService) =>
        new NgQubeeService(
          nestService,
          requestStrategy,
          driver,
          Object.assign({}, config.request)
        )
    },
    {
      provide: PaginationService,
      useFactory: () => {
        const responseConfig = Object.assign({}, config.response);

        if (driver === DriverEnum.JSON_API) {
          return new PaginationService(responseStrategy, new JsonApiResponseOptions(responseConfig));
        }

        return driver === DriverEnum.NESTJS
          ? new PaginationService(responseStrategy, new NestjsResponseOptions(responseConfig))
          : new PaginationService(responseStrategy, responseConfig);
      }
    }
  ]);
}

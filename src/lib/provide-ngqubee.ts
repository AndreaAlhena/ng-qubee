import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { DriverEnum } from './enums/driver.enum';
import { IConfig } from './interfaces/config.interface';
import { IRequestStrategy } from './interfaces/request-strategy.interface';
import { IResponseStrategy } from './interfaces/response-strategy.interface';
import { NestjsResponseOptions } from './models/response-options';
import { NgQubeeService } from './services/ng-qubee.service';
import { NestService } from './services/nest.service';
import { PaginationService } from './services/pagination.service';
import { LaravelRequestStrategy } from './strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from './strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from './strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from './strategies/nestjs-response.strategy';

/**
 * Resolve the request strategy instance for the given driver
 *
 * @param driver - The pagination driver
 * @returns The corresponding request strategy
 */
function resolveRequestStrategy(driver: DriverEnum): IRequestStrategy {
  return driver === DriverEnum.NESTJS
    ? new NestjsRequestStrategy()
    : new LaravelRequestStrategy();
}

/**
 * Resolve the response strategy instance for the given driver
 *
 * @param driver - The pagination driver
 * @returns The corresponding response strategy
 */
function resolveResponseStrategy(driver: DriverEnum): IResponseStrategy {
  return driver === DriverEnum.NESTJS
    ? new NestjsResponseStrategy()
    : new LaravelResponseStrategy();
}

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
export function provideNgQubee(config: IConfig = {}): EnvironmentProviders {
  const driver = config.driver ?? DriverEnum.LARAVEL;
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

        return driver === DriverEnum.NESTJS
          ? new PaginationService(responseStrategy, new NestjsResponseOptions(responseConfig))
          : new PaginationService(responseStrategy, responseConfig);
      }
    }
  ]);
}

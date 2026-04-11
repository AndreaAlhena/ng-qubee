import { ModuleWithProviders, NgModule } from '@angular/core';

import { DriverEnum } from './enums/driver.enum';
import { IConfig } from './interfaces/config.interface';
import { NestjsResponseOptions } from './models/response-options';
import { NgQubeeService } from './services/ng-qubee.service';
import { NestService } from './services/nest.service';
import { PaginationService } from './services/pagination.service';
import { LaravelRequestStrategy } from './strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from './strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from './strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from './strategies/nestjs-response.strategy';

// @dynamic
@NgModule({
  providers: [{
    deps: [NestService],
    provide: NgQubeeService,
    useFactory: (nestService: NestService) =>
      new NgQubeeService(nestService, new LaravelRequestStrategy(), DriverEnum.LARAVEL, {})
  }]
})
export class NgQubeeModule {

  /**
   * Configure NgQubee for the root module
   *
   * @param config - Configuration object with optional driver, request, and response settings
   * @returns Module with providers configured for the specified driver
   */
  public static forRoot(config: IConfig = {}): ModuleWithProviders<NgQubeeModule> {
    const driver = config.driver ?? DriverEnum.LARAVEL;

    const requestStrategy = driver === DriverEnum.NESTJS
      ? new NestjsRequestStrategy()
      : new LaravelRequestStrategy();

    const responseStrategy = driver === DriverEnum.NESTJS
      ? new NestjsResponseStrategy()
      : new LaravelResponseStrategy();

    return {
      ngModule: NgQubeeModule,
      providers: [
        NestService,
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
      ]
    };
  }
}

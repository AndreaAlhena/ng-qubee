import { DriverEnum } from '../enums/driver.enum';
import { PaginationModeEnum } from '../enums/pagination-mode.enum';
import { IPaginationConfig } from '../interfaces/pagination-config.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { JsonApiResponseOptions, NestjsResponseOptions, ResponseOptions, StrapiResponseOptions } from '../models/response-options';
import { JsonApiRequestStrategy } from '../strategies/json-api-request.strategy';
import { JsonApiResponseStrategy } from '../strategies/json-api-response.strategy';
import { LaravelRequestStrategy } from '../strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from '../strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from '../strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from '../strategies/nestjs-response.strategy';
import { PostgrestRequestStrategy } from '../strategies/postgrest-request.strategy';
import { PostgrestResponseStrategy } from '../strategies/postgrest-response.strategy';
import { SpatieRequestStrategy } from '../strategies/spatie-request.strategy';
import { SpatieResponseStrategy } from '../strategies/spatie-response.strategy';
import { StrapiRequestStrategy } from '../strategies/strapi-request.strategy';
import { StrapiResponseStrategy } from '../strategies/strapi-response.strategy';

/**
 * Per-driver factory bundle
 *
 * Names the four pieces a driver contributes — request strategy, response
 * strategy, response-options subclass — so adding a driver is one entry
 * in `DRIVERS` instead of three parallel `switch` cases in the provider
 * builder.
 */
export interface IDriverDefinition {

  /**
   * Build the request strategy for this driver
   *
   * Receives the configured `PaginationModeEnum`; only PostgREST
   * actually consults it today (RANGE-header mode), other drivers
   * ignore the argument.
   *
   * @param paginationMode - Wire-level pagination mechanism
   * @returns A fresh request strategy instance
   */
  createRequestStrategy(paginationMode: PaginationModeEnum): IRequestStrategy;

  /**
   * Build the response strategy for this driver
   *
   * @returns A fresh response strategy instance
   */
  createResponseStrategy(): IResponseStrategy;

  /**
   * Build the driver-specific `ResponseOptions` instance
   *
   * Honours user-supplied key-path overrides via `IPaginationConfig`.
   *
   * @param config - User-supplied response key overrides
   * @returns A `ResponseOptions` (or subclass) carrying the resolved defaults
   */
  createResponseOptions(config: IPaginationConfig): ResponseOptions;
}

/**
 * Driver registry — single source of truth for what each `DriverEnum`
 * value resolves to
 *
 * `Record<DriverEnum, IDriverDefinition>` gives compile-time
 * exhaustiveness: adding a new value to `DriverEnum` fails to compile
 * until its definition is added here. `provideNgQubee` looks up the
 * definition by driver and calls the three factories — no more parallel
 * `switch` blocks.
 */
export const DRIVERS: Record<DriverEnum, IDriverDefinition> = {
  [DriverEnum.JSON_API]: {
    createRequestStrategy: () => new JsonApiRequestStrategy(),
    createResponseStrategy: () => new JsonApiResponseStrategy(),
    createResponseOptions: (config) => new JsonApiResponseOptions(config)
  },

  [DriverEnum.LARAVEL]: {
    createRequestStrategy: () => new LaravelRequestStrategy(),
    createResponseStrategy: () => new LaravelResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  },

  [DriverEnum.NESTJS]: {
    createRequestStrategy: () => new NestjsRequestStrategy(),
    createResponseStrategy: () => new NestjsResponseStrategy(),
    createResponseOptions: (config) => new NestjsResponseOptions(config)
  },

  [DriverEnum.POSTGREST]: {
    createRequestStrategy: (mode) => new PostgrestRequestStrategy(mode),
    createResponseStrategy: () => new PostgrestResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  },

  [DriverEnum.SPATIE]: {
    createRequestStrategy: () => new SpatieRequestStrategy(),
    createResponseStrategy: () => new SpatieResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  },

  [DriverEnum.STRAPI]: {
    createRequestStrategy: () => new StrapiRequestStrategy(),
    createResponseStrategy: () => new StrapiResponseStrategy(),
    createResponseOptions: (config) => new StrapiResponseOptions(config)
  }
};

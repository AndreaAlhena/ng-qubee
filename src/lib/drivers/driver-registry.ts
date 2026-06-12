import { DriverEnum } from '../enums/driver.enum';
import { PaginationModeEnum } from '../enums/pagination-mode.enum';
import { IPaginationConfig } from '../interfaces/pagination-config.interface';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { ApiPlatformResponseOptions, DirectusResponseOptions, DrfResponseOptions, FeathersResponseOptions, JsonApiResponseOptions, JsonServerResponseOptions, NestjsResponseOptions, NestjsxCrudResponseOptions, OdataResponseOptions, PayloadResponseOptions, PocketbaseResponseOptions, ResponseOptions, SieveResponseOptions, SpringResponseOptions, StrapiResponseOptions } from '../models/response-options';
import { ApiPlatformRequestStrategy } from '../strategies/api-platform-request.strategy';
import { ApiPlatformResponseStrategy } from '../strategies/api-platform-response.strategy';
import { DirectusRequestStrategy } from '../strategies/directus-request.strategy';
import { DirectusResponseStrategy } from '../strategies/directus-response.strategy';
import { DrfRequestStrategy } from '../strategies/drf-request.strategy';
import { DrfResponseStrategy } from '../strategies/drf-response.strategy';
import { FeathersRequestStrategy } from '../strategies/feathers-request.strategy';
import { FeathersResponseStrategy } from '../strategies/feathers-response.strategy';
import { JsonApiRequestStrategy } from '../strategies/json-api-request.strategy';
import { JsonApiResponseStrategy } from '../strategies/json-api-response.strategy';
import { JsonServerRequestStrategy } from '../strategies/json-server-request.strategy';
import { JsonServerResponseStrategy } from '../strategies/json-server-response.strategy';
import { LaravelRequestStrategy } from '../strategies/laravel-request.strategy';
import { LaravelResponseStrategy } from '../strategies/laravel-response.strategy';
import { NestjsRequestStrategy } from '../strategies/nestjs-request.strategy';
import { NestjsResponseStrategy } from '../strategies/nestjs-response.strategy';
import { NestjsxCrudRequestStrategy } from '../strategies/nestjsx-crud-request.strategy';
import { NestjsxCrudResponseStrategy } from '../strategies/nestjsx-crud-response.strategy';
import { OdataRequestStrategy } from '../strategies/odata-request.strategy';
import { OdataResponseStrategy } from '../strategies/odata-response.strategy';
import { PayloadRequestStrategy } from '../strategies/payload-request.strategy';
import { PayloadResponseStrategy } from '../strategies/payload-response.strategy';
import { PocketbaseRequestStrategy } from '../strategies/pocketbase-request.strategy';
import { PocketbaseResponseStrategy } from '../strategies/pocketbase-response.strategy';
import { PostgrestRequestStrategy } from '../strategies/postgrest-request.strategy';
import { PostgrestResponseStrategy } from '../strategies/postgrest-response.strategy';
import { SieveRequestStrategy } from '../strategies/sieve-request.strategy';
import { SieveResponseStrategy } from '../strategies/sieve-response.strategy';
import { SpatieRequestStrategy } from '../strategies/spatie-request.strategy';
import { SpatieResponseStrategy } from '../strategies/spatie-response.strategy';
import { SpringRequestStrategy } from '../strategies/spring-request.strategy';
import { SpringResponseStrategy } from '../strategies/spring-response.strategy';
import { StrapiRequestStrategy } from '../strategies/strapi-request.strategy';
import { StrapiResponseStrategy } from '../strategies/strapi-response.strategy';
import { WordpressRequestStrategy } from '../strategies/wordpress-request.strategy';
import { WordpressResponseStrategy } from '../strategies/wordpress-response.strategy';

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
  [DriverEnum.API_PLATFORM]: {
    createRequestStrategy: () => new ApiPlatformRequestStrategy(),
    createResponseStrategy: () => new ApiPlatformResponseStrategy(),
    createResponseOptions: (config) => new ApiPlatformResponseOptions(config)
  },

  [DriverEnum.DIRECTUS]: {
    createRequestStrategy: () => new DirectusRequestStrategy(),
    createResponseStrategy: () => new DirectusResponseStrategy(),
    createResponseOptions: (config) => new DirectusResponseOptions(config)
  },

  [DriverEnum.DRF]: {
    createRequestStrategy: () => new DrfRequestStrategy(),
    createResponseStrategy: () => new DrfResponseStrategy(),
    createResponseOptions: (config) => new DrfResponseOptions(config)
  },

  [DriverEnum.FEATHERS]: {
    createRequestStrategy: () => new FeathersRequestStrategy(),
    createResponseStrategy: () => new FeathersResponseStrategy(),
    createResponseOptions: (config) => new FeathersResponseOptions(config)
  },

  [DriverEnum.JSON_API]: {
    createRequestStrategy: () => new JsonApiRequestStrategy(),
    createResponseStrategy: () => new JsonApiResponseStrategy(),
    createResponseOptions: (config) => new JsonApiResponseOptions(config)
  },

  [DriverEnum.JSON_SERVER]: {
    createRequestStrategy: () => new JsonServerRequestStrategy(),
    createResponseStrategy: () => new JsonServerResponseStrategy(),
    createResponseOptions: (config) => new JsonServerResponseOptions(config)
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

  [DriverEnum.NESTJSX_CRUD]: {
    createRequestStrategy: () => new NestjsxCrudRequestStrategy(),
    createResponseStrategy: () => new NestjsxCrudResponseStrategy(),
    createResponseOptions: (config) => new NestjsxCrudResponseOptions(config)
  },

  [DriverEnum.ODATA]: {
    createRequestStrategy: () => new OdataRequestStrategy(),
    createResponseStrategy: () => new OdataResponseStrategy(),
    createResponseOptions: (config) => new OdataResponseOptions(config)
  },

  [DriverEnum.PAYLOAD]: {
    createRequestStrategy: () => new PayloadRequestStrategy(),
    createResponseStrategy: () => new PayloadResponseStrategy(),
    createResponseOptions: (config) => new PayloadResponseOptions(config)
  },

  [DriverEnum.POCKETBASE]: {
    createRequestStrategy: () => new PocketbaseRequestStrategy(),
    createResponseStrategy: () => new PocketbaseResponseStrategy(),
    createResponseOptions: (config) => new PocketbaseResponseOptions(config)
  },

  [DriverEnum.POSTGREST]: {
    createRequestStrategy: (mode) => new PostgrestRequestStrategy(mode),
    createResponseStrategy: () => new PostgrestResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  },

  [DriverEnum.SIEVE]: {
    createRequestStrategy: () => new SieveRequestStrategy(),
    createResponseStrategy: () => new SieveResponseStrategy(),
    createResponseOptions: (config) => new SieveResponseOptions(config)
  },

  [DriverEnum.SPATIE]: {
    createRequestStrategy: () => new SpatieRequestStrategy(),
    createResponseStrategy: () => new SpatieResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  },

  [DriverEnum.SPRING]: {
    createRequestStrategy: () => new SpringRequestStrategy(),
    createResponseStrategy: () => new SpringResponseStrategy(),
    createResponseOptions: (config) => new SpringResponseOptions(config)
  },

  [DriverEnum.STRAPI]: {
    createRequestStrategy: () => new StrapiRequestStrategy(),
    createResponseStrategy: () => new StrapiResponseStrategy(),
    createResponseOptions: (config) => new StrapiResponseOptions(config)
  },

  [DriverEnum.WORDPRESS]: {
    createRequestStrategy: () => new WordpressRequestStrategy(),
    createResponseStrategy: () => new WordpressResponseStrategy(),
    createResponseOptions: (config) => new ResponseOptions(config)
  }
};

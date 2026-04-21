import { InjectionToken } from '@angular/core';

import { DriverEnum } from '../enums/driver.enum';
import { IRequestStrategy } from '../interfaces/request-strategy.interface';
import { IResponseStrategy } from '../interfaces/response-strategy.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { ResponseOptions } from '../models/response-options';

/**
 * Injection token for the active pagination driver
 *
 * Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` from the
 * user-supplied `IConfig.driver`. Services read it to gate driver-specific
 * behavior (e.g. `NgQubeeService._assertDriver`).
 */
export const NG_QUBEE_DRIVER = new InjectionToken<DriverEnum>('NG_QUBEE_DRIVER');

/**
 * Injection token for the resolved request URI strategy
 *
 * Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
 * active driver. Used by `NgQubeeService` to build request URIs.
 */
export const NG_QUBEE_REQUEST_STRATEGY = new InjectionToken<IRequestStrategy>('NG_QUBEE_REQUEST_STRATEGY');

/**
 * Injection token for the resolved request query-parameter key options
 *
 * Provided as a fully-built `QueryBuilderOptions` instance. `provideNgQubee()`
 * constructs it from `IConfig.request`; consumers don't interact with this
 * token directly.
 */
export const NG_QUBEE_REQUEST_OPTIONS = new InjectionToken<QueryBuilderOptions>('NG_QUBEE_REQUEST_OPTIONS');

/**
 * Injection token for the resolved response parsing strategy
 *
 * Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
 * active driver. Used by `PaginationService` to parse paginated responses.
 */
export const NG_QUBEE_RESPONSE_STRATEGY = new InjectionToken<IResponseStrategy>('NG_QUBEE_RESPONSE_STRATEGY');

/**
 * Injection token for the resolved response field-key options
 *
 * Provided as a fully-built `ResponseOptions` instance (or a driver-specific
 * subclass like `JsonApiResponseOptions` / `NestjsResponseOptions`).
 * `provideNgQubee()` constructs the correct variant from `IConfig.response`.
 */
export const NG_QUBEE_RESPONSE_OPTIONS = new InjectionToken<ResponseOptions>('NG_QUBEE_RESPONSE_OPTIONS');

import { DriverEnum } from '../enums/driver.enum';
import { IPaginationConfig } from './pagination-config.interface';
import { IQueryBuilderConfig } from './query-builder-config.interface';

/**
 * Main configuration interface for ng-qubee
 *
 * Allows configuring the pagination driver and customizing
 * both request query parameter keys and response field keys.
 *
 * @example
 * ```typescript
 * const config: IConfig = {
 *   driver: DriverEnum.NESTJS,
 *   request: { filters: 'filter', sort: 'sortBy' },
 *   response: { data: 'data' }
 * };
 * ```
 */
export interface IConfig {
    /** The pagination driver to use (defaults to LARAVEL) */
    driver?: DriverEnum;
    /** Custom key names for request query parameters */
    request?: IQueryBuilderConfig;
    /** Custom key names for response field mapping */
    response?: IPaginationConfig;
}

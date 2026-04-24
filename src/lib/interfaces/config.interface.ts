import { DriverEnum } from '../enums/driver.enum';
import { PaginationModeEnum } from '../enums/pagination-mode.enum';
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
    /** The pagination driver to use */
    driver: DriverEnum;
    /**
     * Wire-level pagination mechanism. Defaults to `PaginationModeEnum.QUERY`
     * when omitted. Currently honoured only by the PostgREST driver; other
     * drivers ignore it.
     */
    pagination?: PaginationModeEnum;
    /** Custom key names for request query parameters */
    request?: IQueryBuilderConfig;
    /** Custom key names for response field mapping */
    response?: IPaginationConfig;
}

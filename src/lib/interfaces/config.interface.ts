import { IPaginationConfig } from "./pagination-config.interface";
import { IQueryBuilderConfig } from "./query-builder-config.interface";

export interface IConfig {
    request?: IQueryBuilderConfig,
    response?: IPaginationConfig
}
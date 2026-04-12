import { IQueryBuilderState } from './query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';

/**
 * Strategy interface for building request URIs
 *
 * Each driver implements this interface to produce URIs
 * in the format expected by the corresponding backend.
 */
export interface IRequestStrategy {

  /**
   * Build a URI string from the given query builder state
   *
   * @param state - The current query builder state
   * @param options - The query parameter key name configuration
   * @returns The composed URI string
   */
  buildUri(state: IQueryBuilderState, options: QueryBuilderOptions): string;
}

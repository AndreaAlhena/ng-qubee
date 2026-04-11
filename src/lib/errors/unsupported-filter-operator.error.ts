/**
 * Error thrown when filter operators are attempted with the Laravel driver
 *
 * The Laravel driver uses implicit equality filters via `addFilter()` instead of
 * explicit operator filters via `addFilterOperator()`.
 */
export class UnsupportedFilterOperatorError extends Error {
  constructor() {
    super('Filter operators are not supported by the Laravel driver. Use addFilter() instead.');
    this.name = 'UnsupportedFilterOperatorError';
  }
}

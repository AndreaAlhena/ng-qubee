/**
 * Error thrown when filter operators are attempted with a driver that does not support them
 *
 * Filter operators are only supported by the NestJS driver.
 * Use `addFilter()` for Spatie implicit equality filters.
 */
export class UnsupportedFilterOperatorError extends Error {
  constructor() {
    super('Filter operators are only supported by the NestJS driver. Use addFilter() for Spatie.');
    this.name = 'UnsupportedFilterOperatorError';
  }
}

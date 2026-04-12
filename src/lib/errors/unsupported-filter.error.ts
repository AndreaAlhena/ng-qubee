/**
 * Error thrown when filters are attempted with a driver that does not support them
 *
 * Filters are only supported by the Spatie and NestJS drivers.
 */
export class UnsupportedFilterError extends Error {
  constructor() {
    super('Filters are only supported by the Spatie and NestJS drivers.');
    this.name = 'UnsupportedFilterError';
  }
}

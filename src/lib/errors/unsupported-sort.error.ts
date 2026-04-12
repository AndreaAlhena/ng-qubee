/**
 * Error thrown when sorts are attempted with a driver that does not support them
 *
 * Sorts are only supported by the Spatie and NestJS drivers.
 */
export class UnsupportedSortError extends Error {
  constructor() {
    super('Sorts are only supported by the Spatie and NestJS drivers.');
    this.name = 'UnsupportedSortError';
  }
}

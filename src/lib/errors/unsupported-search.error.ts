/**
 * Error thrown when search is attempted with a driver that does not support it
 *
 * Search is only supported by the NestJS driver.
 */
export class UnsupportedSearchError extends Error {
  constructor() {
    super('Search is only supported by the NestJS driver.');
    this.name = 'UnsupportedSearchError';
  }
}

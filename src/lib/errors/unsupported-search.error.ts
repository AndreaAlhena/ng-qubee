/**
 * Error thrown when search is attempted with the Laravel driver
 *
 * The Laravel Spatie Query Builder does not support the search concept.
 */
export class UnsupportedSearchError extends Error {
  constructor() {
    super('Search is not supported by the Laravel driver.');
    this.name = 'UnsupportedSearchError';
  }
}

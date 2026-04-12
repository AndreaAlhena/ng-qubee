/**
 * Error thrown when includes are attempted with a driver that does not support them
 *
 * Includes are only supported by the Spatie driver.
 */
export class UnsupportedIncludesError extends Error {
  constructor() {
    super('Includes are only supported by the Spatie driver.');
    this.name = 'UnsupportedIncludesError';
  }
}

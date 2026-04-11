/**
 * Error thrown when includes are attempted with the NestJS driver
 *
 * The NestJS paginate library does not support the include concept.
 */
export class UnsupportedIncludesError extends Error {
  constructor() {
    super('Includes are not supported by the NestJS driver.');
    this.name = 'UnsupportedIncludesError';
  }
}

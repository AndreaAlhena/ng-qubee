/**
 * Error thrown when flat field selection is attempted with a driver that does not support it
 *
 * Flat field selection is only supported by the NestJS driver.
 * Use `addFields()` for Spatie per-model field selection.
 */
export class UnsupportedSelectError extends Error {
  constructor() {
    super('Flat field selection is only supported by the NestJS driver. Use addFields() for Spatie.');
    this.name = 'UnsupportedSelectError';
  }
}

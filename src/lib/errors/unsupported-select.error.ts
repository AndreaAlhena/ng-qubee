/**
 * Error thrown when flat field selection is attempted with the Laravel driver
 *
 * The Laravel driver uses per-model field selection via `addFields()` instead of
 * flat field selection via `addSelect()`.
 */
export class UnsupportedSelectError extends Error {
  constructor() {
    super('Flat field selection is not supported by the Laravel driver. Use addFields() instead.');
    this.name = 'UnsupportedSelectError';
  }
}

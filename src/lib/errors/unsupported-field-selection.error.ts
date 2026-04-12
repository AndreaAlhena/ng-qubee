/**
 * Error thrown when per-model field selection is attempted with a driver that does not support it
 *
 * Per-model field selection is only supported by the Spatie driver.
 * Use `addSelect()` for NestJS flat field selection.
 */
export class UnsupportedFieldSelectionError extends Error {
  constructor() {
    super('Per-model field selection is only supported by the Spatie driver. Use addSelect() for NestJS.');
    this.name = 'UnsupportedFieldSelectionError';
  }
}

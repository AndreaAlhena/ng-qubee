/**
 * Error thrown when per-model field selection is attempted with the NestJS driver
 *
 * The NestJS driver uses flat field selection via `addSelect()` instead of
 * per-model field selection via `addFields()`.
 */
export class UnsupportedFieldSelectionError extends Error {
  constructor() {
    super('Per-model field selection is not supported by the NestJS driver. Use addSelect() instead.');
    this.name = 'UnsupportedFieldSelectionError';
  }
}

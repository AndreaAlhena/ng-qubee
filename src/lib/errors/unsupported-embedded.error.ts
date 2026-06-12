/**
 * Error thrown when embedded resources are attempted with a driver that
 * does not support them
 *
 * Embedded-resource fetching (`select=col,relation(col1,col2)`) is a
 * PostgREST-native join mechanism and is only supported by the PostgREST
 * driver. Drivers with a standalone relation parameter expose it through
 * `addIncludes()` instead (JSON:API, Spatie, Strapi, @nestjsx/crud).
 */
export class UnsupportedEmbeddedError extends Error {
  constructor() {
    super('Embedded resources are only supported by the PostgREST driver. Use addIncludes() for drivers with a standalone relation parameter.');
    this.name = 'UnsupportedEmbeddedError';
  }
}

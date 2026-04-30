/**
 * Enum representing the available pagination driver types
 *
 * Each driver encapsulates the full format knowledge for both
 * request building (URI generation) and response parsing.
 */
export enum DriverEnum {
  JSON_API = 'json-api',
  LARAVEL = 'laravel',
  NESTJS = 'nestjs',
  POSTGREST = 'postgrest',
  SPATIE = 'spatie',
  STRAPI = 'strapi'
}

/**
 * Enum representing the available pagination driver types
 *
 * Each driver encapsulates the full format knowledge for both
 * request building (URI generation) and response parsing.
 */
export enum DriverEnum {
  DRF = 'drf',
  JSON_API = 'json-api',
  LARAVEL = 'laravel',
  NESTJS = 'nestjs',
  NESTJSX_CRUD = 'nestjsx-crud',
  ODATA = 'odata',
  POSTGREST = 'postgrest',
  SIEVE = 'sieve',
  SPATIE = 'spatie',
  SPRING = 'spring',
  STRAPI = 'strapi'
}

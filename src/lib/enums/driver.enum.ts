/**
 * Enum representing the available pagination driver types
 *
 * Each driver encapsulates the full format knowledge for both
 * request building (URI generation) and response parsing.
 */
export enum DriverEnum {
  API_PLATFORM = 'api-platform',
  DIRECTUS = 'directus',
  DRF = 'drf',
  FEATHERS = 'feathers',
  JSON_API = 'json-api',
  JSON_SERVER = 'json-server',
  LARAVEL = 'laravel',
  NESTJS = 'nestjs',
  NESTJSX_CRUD = 'nestjsx-crud',
  ODATA = 'odata',
  PAYLOAD = 'payload',
  POCKETBASE = 'pocketbase',
  POSTGREST = 'postgrest',
  SIEVE = 'sieve',
  SPATIE = 'spatie',
  SPRING = 'spring',
  STRAPI = 'strapi',
  WORDPRESS = 'wordpress'
}

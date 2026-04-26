/**
 * Enum representing the wire-level pagination mechanism
 *
 * `QUERY` (default) — the request strategy emits `limit` and `offset` (or
 * equivalent) query parameters on the URL.
 *
 * `RANGE` — the request strategy omits URL-based pagination and the
 * consumer instead applies HTTP request headers returned by
 * `NgQubeeService.paginationHeaders()`. Currently honoured only by the
 * PostgREST driver, which maps it to `Range-Unit: items` + `Range: 0-9`.
 * Other drivers ignore the setting.
 */
export enum PaginationModeEnum {
  QUERY = 'query',
  RANGE = 'range'
}

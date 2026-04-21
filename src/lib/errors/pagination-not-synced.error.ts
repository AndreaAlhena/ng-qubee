/**
 * Thrown when a pagination helper that needs `state.lastPage` is called
 * before `PaginationService.paginate()` has ever synced a value.
 *
 * Examples: `NgQubeeService.lastPage()`, `NgQubeeService.totalPages()`.
 *
 * Safe-for-templates predicates (`isLastPage`, `hasNextPage`, etc.) do not
 * throw and return conservative defaults instead.
 */
export class PaginationNotSyncedError extends Error {

  /**
   * @param action - Short imperative describing what the caller was trying
   * to do (e.g. "navigate to last page", "read totalPages"). Surfaced in
   * the error message so the cause is obvious at the call site.
   */
  constructor(action: string) {
    super(`Cannot ${action}: no paginated response has been synced yet. Call PaginationService.paginate() at least once first.`);
    this.name = 'PaginationNotSyncedError';
  }
}

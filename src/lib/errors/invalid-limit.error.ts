/**
 * Thrown when a limit value does not satisfy the active driver's constraints
 *
 * Validation is driver-scoped: most drivers require an integer `>= 1`, while
 * the NestJS driver additionally accepts `-1` as a "fetch all items" sentinel
 * (as documented by nestjs-paginate). The message is tailored accordingly so
 * the caller understands which values are permitted.
 */
export class InvalidLimitError extends Error {

  /**
   * @param limit - The rejected limit value
   * @param allowFetchAll - Whether the active driver accepts `-1` (fetch all)
   */
  constructor(limit: number, allowFetchAll: boolean = false) {
    const allowed = allowFetchAll
      ? 'a positive integer greater than 0, or -1 to fetch all items'
      : 'a positive integer greater than 0';

    super(`Invalid limit value: Limit must be ${allowed}. Received: ${limit}`);
    this.name = 'InvalidLimitError';
  }
}

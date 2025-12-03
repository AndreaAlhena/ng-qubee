export class InvalidLimitError extends Error {
  constructor(limit: number) {
    super(
      `Invalid limit value: Limit must be a positive integer greater than 0. Received: ${limit}`
    );
    this.name = 'InvalidLimitError';
  }
}

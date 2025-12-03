export class InvalidPageNumberError extends Error {
  constructor(page: number) {
    super(
      `Invalid page number: Page must be a positive integer greater than 0. Received: ${page}`
    );
    this.name = 'InvalidPageNumberError';
  }
}

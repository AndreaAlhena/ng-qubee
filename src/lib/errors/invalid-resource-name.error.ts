/**
 * Error thrown when an invalid resource name is provided
 *
 * Resource name must be a non-empty string.
 */
export class InvalidResourceNameError extends Error {
  constructor(resource: string | null | undefined) {
    super(
      `Invalid resource name: Resource name must be a non-empty string. Received: ${JSON.stringify(resource)}`
    );
    this.name = 'InvalidResourceNameError';
  }
}

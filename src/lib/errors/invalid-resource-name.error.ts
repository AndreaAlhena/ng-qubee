export class InvalidModelNameError extends Error {
  constructor(model: string | null | undefined) {
    super(
      `Invalid model name: Model name must be a non-empty string. Received: ${JSON.stringify(model)}`
    );
    this.name = 'InvalidModelNameError';
  }
}

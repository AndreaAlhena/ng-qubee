export class UnselectableModelError extends Error {
    constructor(model: string) {
        super(`Unselectable Model: the selected model (${model}) is not present neither in the "model" property, nor in the includes object.`);
    }
}
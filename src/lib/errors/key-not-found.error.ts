export class KeyNotFoundError extends Error {
    constructor(key: string) {
        super(`Cannot find the key ${key} inside the collection item: does it really exists?`);
    }
}
/**
 * A minimal bag of HTTP response headers that a response strategy can read
 * by name.
 *
 * Accepts anything that exposes a `.get(name): string | null` method
 * (Angular's `HttpHeaders`, the DOM `Headers` class) or a plain object
 * keyed by header name. Consumers should not need to convert between them.
 */
export type HeaderBag =
  | { get(name: string): string | null }
  | Record<string, string | null | undefined>;

/**
 * Read a header value by name from a `HeaderBag`, regardless of whether the
 * bag exposes a `.get()` accessor or plain property access.
 *
 * @param bag - The header bag to read from
 * @param name - The header name (case-sensitivity follows the underlying bag)
 * @returns The header value, or `null` if absent or the bag itself is falsy
 */
export function readHeader(bag: HeaderBag | null | undefined, name: string): string | null {
  if (!bag) {
    return null;
  }

  const accessor = bag as { get?: (name: string) => string | null };

  if (typeof accessor.get === 'function') {
    return accessor.get(name);
  }

  const value = (bag as Record<string, string | null | undefined>)[name];

  return value ?? null;
}

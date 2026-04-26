> **HeaderBag** = \{ `get`: `string` \| `null`; \} \| `Record`\<`string`, `string` \| `null` \| `undefined`\>

Defined in: [src/lib/interfaces/header-bag.interface.ts:9](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/header-bag.interface.ts#L9)

A minimal bag of HTTP response headers that a response strategy can read
by name.

Accepts anything that exposes a `.get(name): string | null` method
(Angular's `HttpHeaders`, the DOM `Headers` class) or a plain object
keyed by header name. Consumers should not need to convert between them.

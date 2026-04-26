Defined in: [src/lib/interfaces/response-strategy.interface.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/response-strategy.interface.ts#L12)

Strategy interface for parsing paginated API responses

Each driver implements this interface to parse responses
from the corresponding backend format into a PaginatedCollection.

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`, `headers?`): [`PaginatedCollection`](../classes/PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/interfaces/response-strategy.interface.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/response-strategy.interface.ts#L26)

Parse a raw API response into a typed PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](IPaginatedObject.md)

#### Parameters

##### response

`Record`\<`string`, `unknown`\>

The raw API response object (body). For drivers that
emit a bare array body (e.g. PostgREST), pass the array here.

##### options

`ResponseOptions`

The response key name configuration

##### headers?

[`HeaderBag`](../type-aliases/HeaderBag.md)

Optional HTTP response headers. Drivers that carry
pagination metadata in headers (PostgREST's `Content-Range`) read from
this bag; body-only drivers ignore it. Accepts anything with a `.get()`
accessor (`HttpHeaders`, `Headers`) or a plain `Record<string, string>`.

#### Returns

[`PaginatedCollection`](../classes/PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

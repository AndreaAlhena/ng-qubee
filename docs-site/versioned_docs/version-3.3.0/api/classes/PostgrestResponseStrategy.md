Defined in: [src/lib/strategies/postgrest-response.strategy.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/strategies/postgrest-response.strategy.ts#L35)

Response strategy for the PostgREST driver

PostgREST (and Supabase, which wraps it) returns a bare array body for
collection endpoints. Pagination metadata is carried in the
`Content-Range` HTTP response header, e.g. `0-9/50` meaning "items 0–9
out of 50 total". Consumers opt into totals by sending the
`Prefer: count=exact` request header.

This strategy expects the consumer to pass the array body as `response`
(or a plain object with `response[options.data]` pointing at the array)
and the response headers via the optional `headers` bag. See
`PaginationService.paginate()` for the call-site shape.

## See

https://postgrest.org/en/stable/references/api/pagination_count.html

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new PostgrestResponseStrategy**(): `PostgrestResponseStrategy`

#### Returns

`PostgrestResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`, `headers?`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/postgrest-response.strategy.ts:53](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/strategies/postgrest-response.strategy.ts#L53)

Parse a PostgREST response into a typed PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](../interfaces/IPaginatedObject.md)

#### Parameters

##### response

`Record`\<`string`, `unknown`\>

The raw response. Either the array body directly, or
an object with the array at `response[options.data]`.

##### options

`ResponseOptions`

The response key configuration (only `options.data` is
consulted; all pagination metadata comes from the Content-Range header).

##### headers?

[`HeaderBag`](../type-aliases/HeaderBag.md)

Optional HTTP response headers. The `Content-Range`
header drives page/total derivation; omission is tolerated and yields
a collection with `undefined` bounds (auto-sync will leave
`isLastPageKnown` at `false`).

#### Returns

[`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](../interfaces/IResponseStrategy.md).[`paginate`](../interfaces/IResponseStrategy.md#paginate)

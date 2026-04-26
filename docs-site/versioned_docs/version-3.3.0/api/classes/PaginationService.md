Defined in: [src/lib/services/pagination.service.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/services/pagination.service.ts#L12)

## Constructors

### Constructor

> **new PaginationService**(`nestService`, `responseStrategy`, `options?`): `PaginationService`

Defined in: [src/lib/services/pagination.service.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/services/pagination.service.ts#L31)

#### Parameters

##### nestService

`NestService`

##### responseStrategy

[`IResponseStrategy`](../interfaces/IResponseStrategy.md)

##### options?

`ResponseOptions` = `...`

#### Returns

`PaginationService`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `headers?`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/services/pagination.service.ts:63](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/services/pagination.service.ts#L63)

Transform a raw API response into a typed PaginatedCollection

Delegates to the active driver's response strategy for parsing, then
auto-syncs the parsed `page` and `lastPage` back into `NestService`
so pagination navigation helpers on `NgQubeeService` can operate
against the live server-reported bounds without consumer bookkeeping.

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](../interfaces/IPaginatedObject.md)

#### Parameters

##### response

The raw API response body. For drivers that emit a
bare array (PostgREST), pass the array.

##### headers?

[`HeaderBag`](../type-aliases/HeaderBag.md)

Optional HTTP response headers. Required by the
PostgREST driver (reads `Content-Range` for pagination metadata);
body-only drivers ignore it. Accepts Angular's `HttpHeaders`, the
native `Headers` class, or a plain `Record<string, string>`.

#### Returns

[`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

#### Remarks

`lastPage` is only synced when the response yields a positive integer.
Server-emitted `0` (empty collection edge case) and absent fields are
treated as "no useful info" and leave `isLastPageKnown: false`.

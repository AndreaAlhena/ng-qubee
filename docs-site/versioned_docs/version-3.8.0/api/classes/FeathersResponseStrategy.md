Defined in: [src/lib/strategies/feathers-response.strategy.ts:37](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/feathers-response.strategy.ts#L37)

Response strategy for the FeathersJS driver

Parses the paginated envelope emitted by Feathers database adapters:

```json
{
  "total": 48,
  "limit": 10,
  "skip": 10,
  "data": [...]
}
```

The envelope is offset-based — no page number, no navigation URLs —
so position derives arithmetically:

- `currentPage` is `skip / limit + 1` (integer division; a zero or
  missing `limit` falls back to page **1**).
- `perPage` comes straight from `limit`; `lastPage` is
  `ceil(total / limit)`.
- `from`/`to` are 1-indexed offsets derived from `skip` and the item
  count of the current page (`from = skip + 1`,
  `to = skip + data.length`); both stay `undefined` on an empty page.

The `data` / `total` / `limit` key names are configurable through
`FeathersResponseOptions`; the `skip` key is fixed by the Feathers
envelope and lives as a private static.

## See

https://feathersjs.com/api/databases/common#pagination

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new FeathersResponseStrategy**(): `FeathersResponseStrategy`

#### Returns

`FeathersResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/feathers-response.strategy.ts:54](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/feathers-response.strategy.ts#L54)

Parse a Feathers pagination response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](../interfaces/IPaginatedObject.md)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response body

##### options

[`ResponseOptions`](ResponseOptions.md)

The response key name configuration

#### Returns

[`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](../interfaces/IResponseStrategy.md).[`paginate`](../interfaces/IResponseStrategy.md#paginate)

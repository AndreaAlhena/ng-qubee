Defined in: [src/lib/strategies/json-server-response.strategy.ts:42](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/json-server-response.strategy.ts#L42)

Response strategy for the json-server driver

Parses json-server v1 paginated responses:

```json
{
  "first": 1,
  "prev": null,
  "next": 2,
  "last": 5,
  "pages": 5,
  "items": 48,
  "data": [...]
}
```

Uniquely among the drivers, `first` / `prev` / `next` / `last` are
**page numbers**, not URLs — so the navigation-URL slots on
`PaginatedCollection` stay `undefined` and the strategy instead uses
the numbers to derive position:

- `currentPage` is `prev + 1` (`prev === null` → page **1**).
- `perPage` is the item count of the current page whenever `next` is
  set (a page with a successor is necessarily full); on the last page
  of a multi-page set it is not introspectable and stays `undefined`.
- `lastPage` comes straight from `pages`; `from`/`to` derive from
  `currentPage` × `perPage` on full pages, or count back from the
  total on the last page (`from = total - items + 1`, `to = total`).

The `data` / `items` / `pages` key paths are configurable through
`JsonServerResponseOptions`; the `prev` / `next` keys are fixed by the
json-server envelope and live as private statics.

## See

https://github.com/typicode/json-server

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new JsonServerResponseStrategy**(): `JsonServerResponseStrategy`

#### Returns

`JsonServerResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/json-server-response.strategy.ts:61](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/json-server-response.strategy.ts#L61)

Parse a json-server pagination response into a PaginatedCollection

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

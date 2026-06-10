Defined in: [src/lib/strategies/drf-response.strategy.ts:43](https://github.com/AndreaAlhena/ng-qubee/blob/acd3b62769801d1ae9cef359b58bd5913b0d5720/src/lib/strategies/drf-response.strategy.ts#L43)

Response strategy for the Django REST Framework (DRF) driver

Parses DRF `PageNumberPagination` responses:

```json
{
  "count": 100,
  "next": "http://api.example.com/items/?page=3",
  "previous": "http://api.example.com/items/?page=1",
  "results": [...]
}
```

DRF emits no `current_page` field in the body, so this strategy
**derives** the current page (and the page size) by inspecting the
`next` / `previous` URLs:

- `previous === null` → current page is **1**.
- `previous` set but has no `?page=N` param → DRF omits `page=1` from
  URLs when the previous page is the first, so we infer **2**.
- `previous` has `?page=N` → current page is **N + 1**.

Similarly, `perPage` is parsed from any `?page_size=N` query param on
`next` or `previous`, and `lastPage` is computed as
`ceil(count / perPage)`. When `perPage` cannot be discovered (e.g. on a
single-page response that emits both URLs as `null`), `perPage` and
`lastPage` are left undefined.

Key paths are resolved through `DrfResponseOptions`, which defaults
`data → 'results'`, `total → 'count'`, `nextPageUrl → 'next'`,
`prevPageUrl → 'previous'`. The current-page / per-page / last-page
paths default to empty strings — the strategy ignores `options` for
those slots and uses URL inspection instead.

## See

https://www.django-rest-framework.org/api-guide/pagination/#pagenumberpagination

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new DrfResponseStrategy**(): `DrfResponseStrategy`

#### Returns

`DrfResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/drf-response.strategy.ts:53](https://github.com/AndreaAlhena/ng-qubee/blob/acd3b62769801d1ae9cef359b58bd5913b0d5720/src/lib/strategies/drf-response.strategy.ts#L53)

Parse a DRF pagination response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](../interfaces/IPaginatedObject.md)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response body

##### options

`ResponseOptions`

The response key name configuration

#### Returns

[`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](../interfaces/IResponseStrategy.md).[`paginate`](../interfaces/IResponseStrategy.md#paginate)

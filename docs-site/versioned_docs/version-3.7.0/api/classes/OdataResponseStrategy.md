Defined in: [src/lib/strategies/odata-response.strategy.ts:40](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/strategies/odata-response.strategy.ts#L40)

Response strategy for the OData v4 driver

Parses OData collection responses:

```json
{
  "@odata.context": "https://api.example.com/$metadata#Products",
  "@odata.count": 100,
  "@odata.nextLink": "https://api.example.com/Products?$count=true&$top=10&$skip=30",
  "value": [...]
}
```

OData emits no current-page or page-size field in the body, so this
strategy **derives** them by inspecting the `@odata.nextLink` URL:

- `perPage` comes from the link's `$top` param, falling back to the
  item count of the current (necessarily full) page when the link
  carries no `$top`.
- `currentPage` is `$skip ÷ perPage` — the next page starts where the
  current one ends. Without a usable link (`$skiptoken`-based
  server-driven paging, or the last page) the strategy falls back to
  page **1**, which is only guaranteed correct for single-page results.
- `lastPage` is `ceil(total ÷ perPage)`; on a link-less response it
  resolves to 1 when the page provably holds the whole result set.

The total requires `$count=true` on the request — the request strategy
always emits it. Envelope keys contain **literal dots** (`@odata.count`),
so key paths from `OdataResponseOptions` are read with flat bracket
access, never dot-path traversal.

## See

https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new OdataResponseStrategy**(): `OdataResponseStrategy`

#### Returns

`OdataResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/odata-response.strategy.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/strategies/odata-response.strategy.ts#L50)

Parse an OData collection response into a PaginatedCollection

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

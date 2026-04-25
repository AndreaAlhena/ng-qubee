# Class: SpatieResponseStrategy

Defined in: [src/lib/strategies/spatie-response.strategy.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/strategies/spatie-response.strategy.ts#L24)

Response strategy for the Spatie Query Builder driver

Parses flat Laravel pagination responses:
```json
{
  "data": [...],
  "current_page": 1,
  "total": 100,
  "per_page": 15,
  "from": 1,
  "to": 15,
  ...
}
```

## See

https://spatie.be/docs/laravel-query-builder

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new SpatieResponseStrategy**(): `SpatieResponseStrategy`

#### Returns

`SpatieResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/spatie-response.strategy.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/strategies/spatie-response.strategy.ts#L34)

Parse a flat Laravel pagination response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](../interfaces/IPaginatedObject.md)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response object

##### options

`ResponseOptions`

The response key name configuration

#### Returns

[`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](../interfaces/IResponseStrategy.md).[`paginate`](../interfaces/IResponseStrategy.md#paginate)

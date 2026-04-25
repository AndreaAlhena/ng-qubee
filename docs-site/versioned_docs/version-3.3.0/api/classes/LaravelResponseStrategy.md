# Class: LaravelResponseStrategy

Defined in: [src/lib/strategies/laravel-response.strategy.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/strategies/laravel-response.strategy.ts#L22)

Response strategy for the Laravel (pagination-only) driver

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

## Implements

- [`IResponseStrategy`](../interfaces/IResponseStrategy.md)

## Constructors

### Constructor

> **new LaravelResponseStrategy**(): `LaravelResponseStrategy`

#### Returns

`LaravelResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](PaginatedCollection.md)\<`T`\>

Defined in: [src/lib/strategies/laravel-response.strategy.ts:32](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/strategies/laravel-response.strategy.ts#L32)

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

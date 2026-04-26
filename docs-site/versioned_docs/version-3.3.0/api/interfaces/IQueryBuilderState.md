Defined in: [src/lib/interfaces/query-builder-state.interface.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L12)

Represents the complete query builder state

This is a superset that covers the needs of all drivers.
Each driver reads only the fields it needs from this state.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:14](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L14)

The base URL to prepend to generated URIs

***

### fields

> **fields**: [`IFields`](IFields.md)

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L16)

Per-model field selection (Spatie only)

***

### filters

> **filters**: [`IFilters`](IFilters.md)

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L18)

Simple key-value filters (Spatie and NestJS)

***

### includes

> **includes**: `string`[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L20)

Related models to include (Spatie only)

***

### isLastPageKnown

> **isLastPageKnown**: `boolean`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L22)

Whether the last paginated response has synced `lastPage` into state

***

### lastPage

> **lastPage**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L24)

Last page number known from the most recent paginated response; only meaningful when `isLastPageKnown` is true

***

### limit

> **limit**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L26)

Number of items per page (all drivers)

***

### operatorFilters

> **operatorFilters**: [`IOperatorFilter`](IOperatorFilter.md)[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L28)

Filters with explicit operators (NestJS only)

***

### page

> **page**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:30](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L30)

Current page number (all drivers)

***

### resource

> **resource**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:32](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L32)

The API resource name for URI generation (all drivers)

***

### search

> **search**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L34)

Full-text search term (NestJS only)

***

### select

> **select**: `string`[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:36](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L36)

Flat field selection (NestJS only)

***

### sorts

> **sorts**: [`ISort`](ISort.md)[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:38](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/query-builder-state.interface.ts#L38)

Sort configurations (Spatie and NestJS)

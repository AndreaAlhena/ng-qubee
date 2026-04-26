Defined in: [src/lib/errors/unsupported-filter-operator.error.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/errors/unsupported-filter-operator.error.ts#L7)

Error thrown when filter operators are attempted with a driver that does not support them

Filter operators are only supported by the NestJS driver.
Use `addFilter()` for Spatie implicit equality filters.

## Extends

- `Error`

## Constructors

### Constructor

> **new UnsupportedFilterOperatorError**(): `UnsupportedFilterOperatorError`

Defined in: [src/lib/errors/unsupported-filter-operator.error.ts:8](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/errors/unsupported-filter-operator.error.ts#L8)

#### Returns

`UnsupportedFilterOperatorError`

#### Overrides

`Error.constructor`

## Properties

### message

> **message**: `string`

Defined in: docs-site/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: docs-site/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack?**: `string`

Defined in: docs-site/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.stack`

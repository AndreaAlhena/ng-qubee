Defined in: [src/lib/errors/pagination-not-synced.error.ts:10](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/errors/pagination-not-synced.error.ts#L10)

Thrown when a pagination helper that needs `state.lastPage` is called
before `PaginationService.paginate()` has ever synced a value.

Examples: `NgQubeeService.lastPage()`, `NgQubeeService.totalPages()`.

Safe-for-templates predicates (`isLastPage`, `hasNextPage`, etc.) do not
throw and return conservative defaults instead.

## Extends

- `Error`

## Constructors

### Constructor

> **new PaginationNotSyncedError**(`action`): `PaginationNotSyncedError`

Defined in: [src/lib/errors/pagination-not-synced.error.ts:17](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/errors/pagination-not-synced.error.ts#L17)

#### Parameters

##### action

`string`

Short imperative describing what the caller was trying
to do (e.g. "navigate to last page", "read totalPages"). Surfaced in
the error message so the cause is obvious at the call site.

#### Returns

`PaginationNotSyncedError`

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

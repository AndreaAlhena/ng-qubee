Defined in: [src/lib/services/ng-qubee.service.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L35)

## Constructors

### Constructor

> **new NgQubeeService**(`_nestService`, `requestStrategy`, `driver`, `options?`): `NgQubeeService`

Defined in: [src/lib/services/ng-qubee.service.ts:64](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L64)

#### Parameters

##### \_nestService

`NestService`

##### requestStrategy

[`IRequestStrategy`](../interfaces/IRequestStrategy.md)

##### driver

[`DriverEnum`](../enumerations/DriverEnum.md)

##### options?

`QueryBuilderOptions` = `...`

#### Returns

`NgQubeeService`

## Properties

### uri$

> **uri$**: `Observable`\<`string`\>

Defined in: [src/lib/services/ng-qubee.service.ts:60](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L60)

Observable that emits non-empty generated URIs

## Methods

### addFields()

> **addFields**(`model`, `fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:100](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L100)

Add fields to the select statement for the given model (JSON:API and Spatie only)

#### Parameters

##### model

`string`

Model that holds the fields

##### fields

`string`[]

Fields to select

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### addFilter()

> **addFilter**(`field`, ...`values`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:122](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L122)

Add a filter with the given value(s) (JSON:API, NestJS, PostgREST, and Spatie)

Produces: `filter[field]=value` (JSON:API / Spatie) or `filter.field=value` (NestJS)

#### Parameters

##### field

`string`

Name of the field to filter

##### values

...(`string` \| `number` \| `boolean`)[]

The needle(s)

#### Returns

`this`

#### Throws

If the active driver does not support filters

***

### addFilterOperator()

> **addFilterOperator**(`field`, `operator`, ...`values`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:148](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L148)

Add a filter with an explicit operator (NestJS and PostgREST)

Produces: `filter.field=$operator:value`

#### Parameters

##### field

`string`

Name of the field to filter

##### operator

[`FilterOperatorEnum`](../enumerations/FilterOperatorEnum.md)

The filter operator to apply

##### values

...(`string` \| `number` \| `boolean`)[]

The value(s) for the filter

#### Returns

`this`

#### Throws

If the active driver does not support filter operators

***

### addIncludes()

> **addIncludes**(...`models`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:168](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L168)

Add related entities to include in the request (JSON:API and Spatie only)

#### Parameters

##### models

...`string`[]

Models to include

#### Returns

`this`

#### Throws

If the active driver does not support includes

***

### addSelect()

> **addSelect**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:189](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L189)

Add flat field selection (NestJS and PostgREST)

Produces: `select=col1,col2`

#### Parameters

##### fields

...`string`[]

Fields to select

#### Returns

`this`

#### Throws

If the active driver does not support flat field selection

***

### addSort()

> **addSort**(`field`, `order`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:209](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L209)

Add a field with a sort criteria (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### field

`string`

Field to use for sorting

##### order

[`SortEnum`](../enumerations/SortEnum.md)

A value from the SortEnum enumeration

#### Returns

`this`

#### Throws

If the active driver does not support sorts

***

### currentPage()

> **currentPage**(): `number`

Defined in: [src/lib/services/ng-qubee.service.ts:227](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L227)

Get the current page number

#### Returns

`number`

The current page number

#### Remarks

Always safe to call. Thin accessor over the internal state's `page` field.

***

### deleteFields()

> **deleteFields**(`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:245](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L245)

Delete selected fields for the given models in the current query builder state (JSON:API and Spatie only)

```
ngQubeeService.deleteFields({
  users: ['email', 'password'],
  address: ['zipcode']
});
```

#### Parameters

##### fields

[`IFields`](../interfaces/IFields.md)

Object mapping model names to field arrays to remove

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### deleteFieldsByModel()

> **deleteFieldsByModel**(`model`, ...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:264](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L264)

Delete selected fields for the given model in the current query builder state (JSON:API and Spatie only)

```
ngQubeeService.deleteFieldsByModel('users', 'email', 'password');
```

#### Parameters

##### model

`string`

Model that holds the fields

##### fields

...`string`[]

Fields to delete from the state

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### deleteFilters()

> **deleteFilters**(...`filters`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:285](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L285)

Remove given filters from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### filters

...`string`[]

Filters to remove

#### Returns

`this`

#### Throws

If the active driver does not support filters

***

### deleteIncludes()

> **deleteIncludes**(...`includes`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:305](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L305)

Remove selected related models from the query builder state (JSON:API and Spatie only)

#### Parameters

##### includes

...`string`[]

Models to remove

#### Returns

`this`

#### Throws

If the active driver does not support includes

***

### deleteOperatorFilters()

> **deleteOperatorFilters**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:324](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L324)

Remove operator filters by field name (NestJS and PostgREST)

#### Parameters

##### fields

...`string`[]

Field names of operator filters to remove

#### Returns

`this`

#### Throws

If the active driver does not support filter operators

***

### deleteSearch()

> **deleteSearch**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:343](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L343)

Remove search term from the query builder state (NestJS only)

#### Returns

`this`

#### Throws

If the active driver does not support search

***

### deleteSelect()

> **deleteSelect**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:358](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L358)

Remove flat field selections from the query builder state (NestJS and PostgREST)

#### Parameters

##### fields

...`string`[]

Fields to remove from selection

#### Returns

`this`

#### Throws

If the active driver does not support flat field selection

***

### deleteSorts()

> **deleteSorts**(...`sorts`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:377](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L377)

Remove sort rules from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### sorts

...`string`[]

Fields used for sorting to remove

#### Returns

`this`

#### Throws

If the active driver does not support sorts

***

### firstPage()

> **firstPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:391](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L391)

Navigate to the first page (page 1)

#### Returns

`this`

#### Remarks

Never throws. Idempotent when already on page 1.

***

### generateUri()

> **generateUri**(): `Observable`\<`string`\>

Defined in: [src/lib/services/ng-qubee.service.ts:402](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L402)

Generate a URI accordingly to the given data and active driver

#### Returns

`Observable`\<`string`\>

An observable that emits the generated URI

***

### goToPage()

> **goToPage**(`n`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:422](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L422)

Navigate directly to the specified page

Validates integer/positive via the existing `setPage` path, and
additionally rejects values that exceed `state.lastPage` when
pagination bounds are known.

#### Parameters

##### n

`number`

Target page number

#### Returns

`this`

#### Throws

If `n` is not a positive integer, or if `n > state.lastPage` when `state.isLastPageKnown` is true

***

### hasNextPage()

> **hasNextPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:440](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L440)

Check whether a next page exists

#### Returns

`boolean`

`true` if `state.page < state.lastPage` when bounds are known, or `true` when bounds are unknown

#### Remarks

Template-safe. Returns `true` when pagination bounds are unknown (conservative default — keeps a "Next" button enabled before the first `paginate()` call).

***

### hasPreviousPage()

> **hasPreviousPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:452](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L452)

Check whether a previous page exists

#### Returns

`boolean`

`true` if `state.page > 1`

#### Remarks

Always safe. Does not require a synced paginated response.

***

### isFirstPage()

> **isFirstPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:462](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L462)

Check whether the current page is the first page

#### Returns

`boolean`

`true` if `state.page === 1`

#### Remarks

Always safe. Does not require a synced paginated response.

***

### isLastPage()

> **isLastPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:472](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L472)

Check whether the current page is the last page

#### Returns

`boolean`

`true` only when `state.isLastPageKnown` and `state.page === state.lastPage`

#### Remarks

Template-safe. Returns `false` when pagination bounds are unknown (no paginated response has been synced yet) — keeps "Next" navigation unblocked until the first `paginate()` call syncs.

***

### lastPage()

> **lastPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:485](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L485)

Navigate to the last page known from the most recent paginated response

#### Returns

`this`

#### Remarks

Requires at least one `PaginationService.paginate()` call to have synced `state.lastPage`. Before that, the bound is unknown and this method throws.

#### Throws

If `state.isLastPageKnown` is false (no paginated response has been synced yet)

***

### nextPage()

> **nextPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:503](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L503)

Navigate to the next page

#### Returns

`this`

#### Remarks

Never throws. Idempotent at the known last page (no-op). Pair with `hasNextPage()` for a disable-state binding.

***

### paginationHeaders()

> **paginationHeaders**(): `Record`\<`string`, `string`\> \| `null`

Defined in: [src/lib/services/ng-qubee.service.ts:527](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L527)

HTTP request headers the active driver wants the consumer to apply

Returns `null` for drivers that pass all pagination metadata on the
URL (Laravel, Spatie, JSON:API, NestJS, and PostgREST in its default
QUERY mode). Returns a map of header name → value when the active
driver uses HTTP headers instead — today, only the PostgREST driver
configured with `PaginationModeEnum.RANGE`, which yields
`{ 'Range-Unit': 'items', 'Range': 'from-to' }`.

#### Returns

`Record`\<`string`, `string`\> \| `null`

Map of headers to apply to the HTTP request, or `null` when not needed

***

### previousPage()

> **previousPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:541](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L541)

Navigate to the previous page

#### Returns

`this`

#### Remarks

Never throws. Idempotent at page 1 (floored). Pair with `hasPreviousPage()` for a disable-state binding.

***

### reset()

> **reset**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:558](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L558)

Clear the current state and reset the Query Builder to a fresh, clean condition

#### Returns

`this`

***

### setBaseUrl()

> **setBaseUrl**(`baseUrl`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:570](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L570)

Set the base URL to use for composing the address

#### Parameters

##### baseUrl

`string`

The base URL

#### Returns

`this`

***

### setLimit()

> **setLimit**(`limit`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:588](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L588)

Set the items per page number

Validation is delegated to the active request strategy because the
accepted range is driver-specific: nestjs-paginate additionally accepts
`-1` as a "fetch all" sentinel, while Laravel, Spatie, and JSON:API
require a positive integer.

#### Parameters

##### limit

`number`

Number of items per page (or `-1` to fetch all, NestJS only)

#### Returns

`this`

#### Throws

If the value is not accepted by the active driver

***

### setPage()

> **setPage**(`page`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:602](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L602)

Set the page that the backend will use to paginate the result set

#### Parameters

##### page

`number`

Page number

#### Returns

`this`

***

### setResource()

> **setResource**(`resource`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:614](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L614)

Set the API resource to run the query against

#### Parameters

##### resource

`string`

Resource name (e.g. 'users' produces /users)

#### Returns

`this`

***

### setSearch()

> **setSearch**(`search`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:630](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L630)

Set the search term for full-text search (NestJS only)

Produces: `search=term`

#### Parameters

##### search

`string`

The search term

#### Returns

`this`

#### Throws

If the active driver does not support search

***

### totalPages()

> **totalPages**(): `number`

Defined in: [src/lib/services/ng-qubee.service.ts:645](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/services/ng-qubee.service.ts#L645)

Get the total number of pages reported by the most recent paginated response

#### Returns

`number`

The last page number

#### Remarks

Throws when called before any `paginate()` has synced a value. For a non-throwing read in a template, read `nest().isLastPageKnown` first as a guard.

#### Throws

If `state.isLastPageKnown` is false (no paginated response has been synced yet)

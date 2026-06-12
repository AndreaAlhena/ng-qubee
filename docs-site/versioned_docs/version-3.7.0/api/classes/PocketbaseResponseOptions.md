Defined in: [src/lib/models/response-options.ts:350](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L350)

Pre-configured ResponseOptions for the PocketBase driver

The records-list envelope is flat: `{ page, perPage, totalItems,
totalPages, items }`. The envelope carries no `from`/`to` indices and
no navigation links, so those paths default to empty strings (the
strategy derives `from`/`to` from `page` × `perPage` and leaves the
URLs `undefined`); all paths are overridable via `IPaginationConfig`
(dot notation supported) for custom wrappers.

## Extends

- [`ResponseOptions`](ResponseOptions.md)

## Constructors

### Constructor

> **new PocketbaseResponseOptions**(`options`): `PocketbaseResponseOptions`

Defined in: [src/lib/models/response-options.ts:351](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L351)

#### Parameters

##### options

[`IPaginationConfig`](../interfaces/IPaginationConfig.md)

#### Returns

`PocketbaseResponseOptions`

#### Overrides

[`ResponseOptions`](ResponseOptions.md).[`constructor`](ResponseOptions.md#constructor)

## Properties

### currentPage

> `readonly` **currentPage**: `string`

Defined in: [src/lib/models/response-options.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L18)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`currentPage`](ResponseOptions.md#currentpage)

***

### data

> `readonly` **data**: `string`

Defined in: [src/lib/models/response-options.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L19)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`data`](ResponseOptions.md#data)

***

### firstPageUrl

> `readonly` **firstPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L20)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`firstPageUrl`](ResponseOptions.md#firstpageurl)

***

### from

> `readonly` **from**: `string`

Defined in: [src/lib/models/response-options.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L21)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`from`](ResponseOptions.md#from)

***

### lastPage

> `readonly` **lastPage**: `string`

Defined in: [src/lib/models/response-options.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L22)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`lastPage`](ResponseOptions.md#lastpage)

***

### lastPageUrl

> `readonly` **lastPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L23)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`lastPageUrl`](ResponseOptions.md#lastpageurl)

***

### nextPageUrl

> `readonly` **nextPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L24)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`nextPageUrl`](ResponseOptions.md#nextpageurl)

***

### path

> `readonly` **path**: `string`

Defined in: [src/lib/models/response-options.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L25)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`path`](ResponseOptions.md#path)

***

### perPage

> `readonly` **perPage**: `string`

Defined in: [src/lib/models/response-options.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L26)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`perPage`](ResponseOptions.md#perpage)

***

### prevPageUrl

> `readonly` **prevPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L27)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`prevPageUrl`](ResponseOptions.md#prevpageurl)

***

### to

> `readonly` **to**: `string`

Defined in: [src/lib/models/response-options.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L28)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`to`](ResponseOptions.md#to)

***

### total

> `readonly` **total**: `string`

Defined in: [src/lib/models/response-options.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L29)

#### Inherited from

[`ResponseOptions`](ResponseOptions.md).[`total`](ResponseOptions.md#total)

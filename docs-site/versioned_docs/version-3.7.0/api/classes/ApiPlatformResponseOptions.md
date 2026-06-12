Defined in: [src/lib/models/response-options.ts:57](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L57)

Pre-configured ResponseOptions for the API Platform (Symfony) driver

Uses dot-notation paths into the Hydra/JSON-LD envelope — the Hydra
keys contain colons but no dots, so `hydra:view.hydra:next` traverses
`response['hydra:view']['hydra:next']`. The `path` slot points at the
view's `@id`, which the strategy parses for the current page and page
size; `currentPage` / `perPage` / `lastPage` have no body field and
default to empty paths (derived from the view URLs instead).

## Extends

- [`ResponseOptions`](ResponseOptions.md)

## Constructors

### Constructor

> **new ApiPlatformResponseOptions**(`options`): `ApiPlatformResponseOptions`

Defined in: [src/lib/models/response-options.ts:58](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/models/response-options.ts#L58)

#### Parameters

##### options

[`IPaginationConfig`](../interfaces/IPaginationConfig.md)

#### Returns

`ApiPlatformResponseOptions`

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

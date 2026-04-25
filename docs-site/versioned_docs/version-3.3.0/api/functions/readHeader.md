# Function: readHeader()

> **readHeader**(`bag`, `name`): `string` \| `null`

Defined in: [src/lib/interfaces/header-bag.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/interfaces/header-bag.interface.ts#L21)

Read a header value by name from a `HeaderBag`, regardless of whether the
bag exposes a `.get()` accessor or plain property access.

## Parameters

### bag

[`HeaderBag`](../type-aliases/HeaderBag.md) \| `null` \| `undefined`

The header bag to read from

### name

`string`

The header name (case-sensitivity follows the underlying bag)

## Returns

`string` \| `null`

The header value, or `null` if absent or the bag itself is falsy

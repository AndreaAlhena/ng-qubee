> **readHeader**(`bag`, `name`): `string` \| `null`

Defined in: [src/lib/interfaces/header-bag.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/interfaces/header-bag.interface.ts#L21)

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

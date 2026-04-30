Defined in: [src/lib/interfaces/config.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/interfaces/config.interface.ts#L21)

Main configuration interface for ng-qubee

Allows configuring the pagination driver and customizing
both request query parameter keys and response field keys.

## Example

```typescript
const config: IConfig = {
  driver: DriverEnum.NESTJS,
  request: { filters: 'filter', sort: 'sortBy' },
  response: { data: 'data' }
};
```

## Properties

### driver

> **driver**: [`DriverEnum`](../enumerations/DriverEnum.md)

Defined in: [src/lib/interfaces/config.interface.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/interfaces/config.interface.ts#L23)

The pagination driver to use

***

### pagination?

> `optional` **pagination?**: [`PaginationModeEnum`](../enumerations/PaginationModeEnum.md)

Defined in: [src/lib/interfaces/config.interface.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/interfaces/config.interface.ts#L29)

Wire-level pagination mechanism. Defaults to `PaginationModeEnum.QUERY`
when omitted. Currently honoured only by the PostgREST driver; other
drivers ignore it.

***

### request?

> `optional` **request?**: [`IQueryBuilderConfig`](IQueryBuilderConfig.md)

Defined in: [src/lib/interfaces/config.interface.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/interfaces/config.interface.ts#L31)

Custom key names for request query parameters

***

### response?

> `optional` **response?**: [`IPaginationConfig`](IPaginationConfig.md)

Defined in: [src/lib/interfaces/config.interface.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/interfaces/config.interface.ts#L33)

Custom key names for response field mapping

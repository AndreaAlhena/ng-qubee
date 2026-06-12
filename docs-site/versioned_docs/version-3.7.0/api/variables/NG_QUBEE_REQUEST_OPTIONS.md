> `const` **NG\_QUBEE\_REQUEST\_OPTIONS**: `InjectionToken`\<[`QueryBuilderOptions`](../classes/QueryBuilderOptions.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/tokens/ng-qubee.tokens.ts#L33)

Injection token for the resolved request query-parameter key options

Provided as a fully-built `QueryBuilderOptions` instance. `provideNgQubee()`
constructs it from `IConfig.request`; consumers don't interact with this
token directly.

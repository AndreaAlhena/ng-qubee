> `const` **NG\_QUBEE\_REQUEST\_OPTIONS**: `InjectionToken`\<`QueryBuilderOptions`\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/1cd6a1e62b8ad701ae642ec09bab2c3c3e467b57/src/lib/tokens/ng-qubee.tokens.ts#L33)

Injection token for the resolved request query-parameter key options

Provided as a fully-built `QueryBuilderOptions` instance. `provideNgQubee()`
constructs it from `IConfig.request`; consumers don't interact with this
token directly.

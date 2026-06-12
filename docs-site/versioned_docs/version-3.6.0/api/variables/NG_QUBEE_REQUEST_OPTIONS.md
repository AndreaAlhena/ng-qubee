> `const` **NG\_QUBEE\_REQUEST\_OPTIONS**: `InjectionToken`\<`QueryBuilderOptions`\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/acd3b62769801d1ae9cef359b58bd5913b0d5720/src/lib/tokens/ng-qubee.tokens.ts#L33)

Injection token for the resolved request query-parameter key options

Provided as a fully-built `QueryBuilderOptions` instance. `provideNgQubee()`
constructs it from `IConfig.request`; consumers don't interact with this
token directly.

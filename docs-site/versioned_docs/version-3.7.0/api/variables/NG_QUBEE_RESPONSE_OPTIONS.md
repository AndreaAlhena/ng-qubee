> `const` **NG\_QUBEE\_RESPONSE\_OPTIONS**: `InjectionToken`\<[`ResponseOptions`](../classes/ResponseOptions.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/tokens/ng-qubee.tokens.ts#L50)

Injection token for the resolved response field-key options

Provided as a fully-built `ResponseOptions` instance (or a driver-specific
subclass like `JsonApiResponseOptions` / `NestjsResponseOptions`).
`provideNgQubee()` constructs the correct variant from `IConfig.response`.

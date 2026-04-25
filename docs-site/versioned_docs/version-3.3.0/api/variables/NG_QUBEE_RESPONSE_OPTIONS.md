# Variable: NG\_QUBEE\_RESPONSE\_OPTIONS

> `const` **NG\_QUBEE\_RESPONSE\_OPTIONS**: `InjectionToken`\<`ResponseOptions`\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/tokens/ng-qubee.tokens.ts#L50)

Injection token for the resolved response field-key options

Provided as a fully-built `ResponseOptions` instance (or a driver-specific
subclass like `JsonApiResponseOptions` / `NestjsResponseOptions`).
`provideNgQubee()` constructs the correct variant from `IConfig.response`.

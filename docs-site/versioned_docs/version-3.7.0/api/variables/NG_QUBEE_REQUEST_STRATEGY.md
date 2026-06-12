> `const` **NG\_QUBEE\_REQUEST\_STRATEGY**: `InjectionToken`\<[`IRequestStrategy`](../interfaces/IRequestStrategy.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/tokens/ng-qubee.tokens.ts#L24)

Injection token for the resolved request URI strategy

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
active driver. Used by `NgQubeeService` to build request URIs.

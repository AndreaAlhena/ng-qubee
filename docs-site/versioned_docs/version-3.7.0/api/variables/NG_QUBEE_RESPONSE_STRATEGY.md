> `const` **NG\_QUBEE\_RESPONSE\_STRATEGY**: `InjectionToken`\<[`IResponseStrategy`](../interfaces/IResponseStrategy.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/005cbeb73dc9b7703fe7424818735afcf9938d65/src/lib/tokens/ng-qubee.tokens.ts#L41)

Injection token for the resolved response parsing strategy

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
active driver. Used by `PaginationService` to parse paginated responses.

> `const` **NG\_QUBEE\_RESPONSE\_STRATEGY**: `InjectionToken`\<[`IResponseStrategy`](../interfaces/IResponseStrategy.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/tokens/ng-qubee.tokens.ts#L41)

Injection token for the resolved response parsing strategy

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
active driver. Used by `PaginationService` to parse paginated responses.

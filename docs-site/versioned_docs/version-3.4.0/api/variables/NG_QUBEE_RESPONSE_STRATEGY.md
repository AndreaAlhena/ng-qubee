> `const` **NG\_QUBEE\_RESPONSE\_STRATEGY**: `InjectionToken`\<[`IResponseStrategy`](../interfaces/IResponseStrategy.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/f79e86dae8850de5766aacb086cf9492f3a5d941/src/lib/tokens/ng-qubee.tokens.ts#L41)

Injection token for the resolved response parsing strategy

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` based on the
active driver. Used by `PaginationService` to parse paginated responses.

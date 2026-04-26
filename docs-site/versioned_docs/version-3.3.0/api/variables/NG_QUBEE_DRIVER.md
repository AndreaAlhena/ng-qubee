> `const` **NG\_QUBEE\_DRIVER**: `InjectionToken`\<[`DriverEnum`](../enumerations/DriverEnum.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/tokens/ng-qubee.tokens.ts#L16)

Injection token for the active pagination driver

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` from the
user-supplied `IConfig.driver`. Services read it to gate driver-specific
behavior (e.g. `NgQubeeService._assertDriver`).

# Variable: NG\_QUBEE\_DRIVER

> `const` **NG\_QUBEE\_DRIVER**: `InjectionToken`\<[`DriverEnum`](../enumerations/DriverEnum.md)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/tokens/ng-qubee.tokens.ts#L16)

Injection token for the active pagination driver

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` from the
user-supplied `IConfig.driver`. Services read it to gate driver-specific
behavior (e.g. `NgQubeeService._assertDriver`).

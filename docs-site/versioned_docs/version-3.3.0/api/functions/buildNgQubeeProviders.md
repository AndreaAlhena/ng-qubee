> **buildNgQubeeProviders**(`config`): `Provider`[]

Defined in: [src/lib/provide-ngqubee.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/provide-ngqubee.ts#L34)

Build the core provider list shared by `provideNgQubee()` and
`NgQubeeModule.forRoot()`

Looks up the driver definition from the registry and calls its three
factories — request strategy, response strategy, response options.
Adding a driver means adding one entry to `DRIVERS`; this function
does not change.

Exposes the driver, strategies, and options via injection tokens so that
consumers can request a component-scoped instance of the services through
`provideNgQubeeInstance()`.

## Parameters

### config

[`IConfig`](../interfaces/IConfig.md)

Configuration object compliant to the IConfig interface

## Returns

`Provider`[]

An array of Providers for the environment injector

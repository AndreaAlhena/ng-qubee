> **provideNgQubee**(`config`): `EnvironmentProviders`

Defined in: [src/lib/provide-ngqubee.ts:97](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/provide-ngqubee.ts#L97)

Sets up providers necessary to enable `NgQubee` functionality for the application.

## Parameters

### config

[`IConfig`](../interfaces/IConfig.md)

Configuration object compliant to the IConfig interface

## Returns

`EnvironmentProviders`

A set of providers to setup NgQubee

## Usage Notes

Basic example with the Laravel driver:
```
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.LARAVEL })]
});
```

Spatie driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
});
```

JSON:API driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.JSON_API })]
});
```

NestJS driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.NESTJS })]
});
```

## Public Api

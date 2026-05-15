> **provideNgQubee**(`config`): `EnvironmentProviders`

Defined in: [src/lib/provide-ngqubee.ts:97](https://github.com/AndreaAlhena/ng-qubee/blob/1cd6a1e62b8ad701ae642ec09bab2c3c3e467b57/src/lib/provide-ngqubee.ts#L97)

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

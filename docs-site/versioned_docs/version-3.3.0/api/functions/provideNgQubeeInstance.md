# Function: provideNgQubeeInstance()

> **provideNgQubeeInstance**(): `Provider`[]

Defined in: [src/lib/provide-ngqubee.ts:128](https://github.com/AndreaAlhena/ng-qubee/blob/dca5f28601740c09e0f530d078a305173a7b6535/src/lib/provide-ngqubee.ts#L128)

Providers for a component-scoped NgQubee instance

Use this inside a standalone component's `providers: [...]` to get a
dedicated `NgQubeeService` (and its `NestService` / `PaginationService`
collaborators) whose query-builder and pagination state does not bleed
with the app-wide shared instance provided by `provideNgQubee()`.

## Returns

`Provider`[]

A provider array to spread into a component's `providers`

## Usage Notes

```
@Component({
  standalone: true,
  providers: [...provideNgQubeeInstance()]
})
export class MyFeatureComponent {
  constructor(private _qb: NgQubeeService) {}
}
```

The driver, strategies, and options are inherited from the environment
injector (`provideNgQubee()` at root), so only the service instances are
re-created at the component level.

## Public Api

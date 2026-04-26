> **provideNgQubeeInstance**(): `Provider`[]

Defined in: [src/lib/provide-ngqubee.ts:128](https://github.com/AndreaAlhena/ng-qubee/blob/81c0aafd71cb5e20f2b5ebdcc6ea8335bac695b3/src/lib/provide-ngqubee.ts#L128)

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

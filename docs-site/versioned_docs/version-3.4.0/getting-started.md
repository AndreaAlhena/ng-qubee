---
sidebar_position: 1
title: Getting Started
---

# Getting Started

`ng-qubee` is a query builder for Angular. It composes API request URIs (filters, sorts, pagination, column selection) and parses paginated responses, with a pluggable driver system that targets five backends today and is built to grow.

- Easily retrieve URIs from a service
- Pagination ready, with auto-sync from response to query state
- Reactive — URIs emit through an RxJS Observable
- Test-driven, ~460 specs covering every driver path
- **Multi-driver:** JSON:API, Laravel (pagination-only), Spatie Query Builder, NestJS (nestjs-paginate), PostgREST / Supabase

## Requirements

| Dependency | Range |
|---|---|
| Angular | `>=16.0.0 <22.0.0` |
| RxJS | `^6.5.0 || ^7.0.0` |

Angular 16+ is required because the library uses Angular Signals for state management.

## Installation

```bash
npm install ng-qubee
```

## Configure a driver

`ng-qubee` requires you to pick a driver at bootstrap. There's no default — every driver speaks a different wire format and the library wants you to be explicit.

```typescript title="main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { DriverEnum, provideNgQubee } from 'ng-qubee';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgQubee({ driver: DriverEnum.SPATIE })
  ]
});
```

Module-style equivalent:

```typescript title="app.module.ts"
import { NgModule } from '@angular/core';
import { DriverEnum, NgQubeeModule } from 'ng-qubee';

@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.SPATIE })
  ]
})
export class AppModule {}
```

## Build your first request

Inject the service, set a resource, add filters / sorts / pagination, and subscribe to the URI stream:

```typescript
import { Component } from '@angular/core';
import { NgQubeeService, SortEnum } from 'ng-qubee';

@Component({ /* ... */ })
export class UsersComponent {
  constructor(private _qb: NgQubeeService) {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addSort('created_at', SortEnum.DESC)
            .setLimit(25);

    this._qb.generateUri().subscribe(uri => {
      // Spatie driver: /users?filter[status]=active&limit=25&page=1&sort=-created_at
      console.log(uri);
    });
  }
}
```

The exact URI shape depends on the driver. See the [Drivers](./drivers/json-api.md) section for the format produced by each.

## Pick a driver

Six drivers ship out of the box:

| Driver | Best for |
|---|---|
| [**JSON:API**](./drivers/json-api.md) | Any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir) |
| [**Laravel**](./drivers/laravel.md) | Plain Laravel pagination (limit + page only — no filters/sorts) |
| [**Spatie**](./drivers/spatie.md) | [Spatie Query Builder](https://spatie.be/docs/laravel-query-builder) for Laravel |
| [**NestJS**](./drivers/nestjs.md) | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) |
| [**PostgREST**](./drivers/postgrest.md) | [PostgREST](https://postgrest.org/) and [Supabase](https://supabase.com/) |
| [**Strapi**](./drivers/strapi.md) | [Strapi](https://strapi.io/) v4 / v5 headless CMS |

## Next steps

- [Query Builder API](./query-builder.md) — every fluent method on `NgQubeeService`
- [Pagination](./pagination.md) — navigation helpers, auto-sync, response parsing
- [Per-component instances](./per-component-instances.md) — isolate state per feature component

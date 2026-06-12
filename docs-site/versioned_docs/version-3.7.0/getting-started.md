---
sidebar_position: 1
title: Getting Started
---

# Getting Started

`ng-qubee` is a query builder for Angular. It composes API request URIs (filters, sorts, pagination, column selection) and parses paginated responses, with a pluggable driver system that targets ten backends today and is built to grow.

- Easily retrieve URIs from a service
- Pagination ready, with auto-sync from response to query state
- Reactive — URIs emit through an RxJS Observable
- Test-driven, 980+ specs covering every driver path
- **Multi-driver:** API Platform (Symfony), Directus, Django REST Framework, FeathersJS, JSON:API, json-server, Laravel (pagination-only), Spatie Query Builder, NestJS (nestjs-paginate), @nestjsx/crud, OData, Payload CMS, PocketBase, PostgREST / Supabase, Sieve (.NET), Spring Data REST, Strapi, WordPress REST

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

Eighteen drivers ship out of the box:

| Driver | Best for |
|---|---|
| [**JSON:API**](./drivers/json-api.md) | Any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir) |
| [**Laravel**](./drivers/laravel.md) | Plain Laravel pagination (limit + page only — no filters/sorts) |
| [**Spatie**](./drivers/spatie.md) | [Spatie Query Builder](https://spatie.be/docs/laravel-query-builder) for Laravel |
| [**NestJS**](./drivers/nestjs.md) | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) |
| [**PostgREST**](./drivers/postgrest.md) | [PostgREST](https://postgrest.org/) and [Supabase](https://supabase.com/) |
| [**Strapi**](./drivers/strapi.md) | [Strapi](https://strapi.io/) v4 / v5 headless CMS |
| [**DRF**](./drivers/drf.md) | [Django REST Framework](https://www.django-rest-framework.org/) + [django-filter](https://django-filter.readthedocs.io/) |
| [**@nestjsx/crud**](./drivers/nestjsx-crud.md) | [@nestjsx/crud](https://github.com/nestjsx/crud) CRUD framework for NestJS |
| [**Spring**](./drivers/spring.md) | [Spring Data REST](https://spring.io/projects/spring-data-rest) (Java / Spring Boot, HAL responses) |
| [**Sieve**](./drivers/sieve.md) | [Sieve](https://github.com/Biarity/Sieve) for ASP.NET Core |
| [**OData**](./drivers/odata.md) | [OData v4](https://www.odata.org/) (ASP.NET Core OData, SAP, Microsoft Graph) |
| [**Directus**](./drivers/directus.md) | [Directus](https://directus.io/) headless CMS / data platform |
| [**json-server**](./drivers/json-server.md) | [json-server](https://github.com/typicode/json-server) mock REST API for prototyping |
| [**API Platform**](./drivers/api-platform.md) | [API Platform](https://api-platform.com/) for PHP/Symfony (Hydra/JSON-LD) |
| [**Feathers**](./drivers/feathers.md) | [FeathersJS](https://feathersjs.com/) realtime/REST framework for Node.js |
| [**PocketBase**](./drivers/pocketbase.md) | [PocketBase](https://pocketbase.io/) single-binary backend (SQLite + realtime + auth) |
| [**Payload**](./drivers/payload.md) | [Payload CMS](https://payloadcms.com/) and any `mongoose-paginate-v2` backend |
| [**WordPress**](./drivers/wordpress.md) | [WordPress REST API](https://developer.wordpress.org/rest-api/) (every WP install since 4.7) |

## Next steps

- [Query Builder API](./query-builder.md) — every fluent method on `NgQubeeService`
- [Pagination](./pagination.md) — navigation helpers, auto-sync, response parsing
- [Per-component instances](./per-component-instances.md) — isolate state per feature component

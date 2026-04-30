<p align="center">
  <img width="500" height="500" src="https://i.ibb.co/LdXRKyG/logo.png">
</p>

# Your next Angular Query Builder 🐝

[![CI](https://github.com/AndreaAlhena/ng-qubee/workflows/CI/badge.svg)](https://github.com/AndreaAlhena/ng-qubee/actions)
[![codecov](https://codecov.io/gh/AndreaAlhena/ng-qubee/branch/master/graph/badge.svg)](https://codecov.io/gh/AndreaAlhena/ng-qubee)
[![npm version](https://badge.fury.io/js/ng-qubee.svg)](https://www.npmjs.com/package/ng-qubee)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NgQubee is a query builder for Angular. Compose your API requests without re-inventing the wheel.

- Reactive — URIs emitted as RxJS observables, state held in Angular Signals
- Pagination ready — typed `PaginatedCollection`, fluent navigation (`nextPage`, `lastPage`, `goToPage`)
- Test-driven — 495+ specs
- **Multi-driver support**: JSON:API, Laravel (pagination-only), Spatie Query Builder, NestJS (`nestjs-paginate`), PostgREST / Supabase, and Strapi

## 📚 Documentation

**Full documentation lives at [ng-qubee.andreatantimonaco.me](https://ng-qubee.andreatantimonaco.me)** — driver guides, query-builder API, pagination helpers, auto-generated API reference, and version history.

This README is intentionally minimal. For everything beyond install + a five-line example, head to the docs site.

## Requirements

- **Angular** ≥ 16 (uses Signals)
- **RxJS** ^6.5.0 || ^7.0.0

## Install

```sh
npm i ng-qubee
```

## Drivers

A driver **must** be specified in the configuration:

| Driver | Backend | Wire format snapshot |
|---|---|---|
| **JSON:API** | Any [JSON:API](https://jsonapi.org/format/)-compliant backend | `filter[field]=value`, `sort=-field`, `page[number]=N&page[size]=N` |
| **Laravel** | Plain Laravel pagination | `limit=N&page=N` (pagination only) |
| **Spatie** | [Spatie Laravel Query Builder](https://spatie.be/docs/laravel-query-builder) | `filter[field]=value`, `sort=-field` |
| **NestJS** | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) | `filter.field=$op:value`, `sortBy=field:DESC` |
| **PostgREST** | [PostgREST](https://postgrest.org/) / [Supabase](https://supabase.com/) | `col=eq.value`, `order=col.asc`, `limit=N&offset=M` |
| **Strapi** | [Strapi](https://strapi.io/) v4 / v5 headless CMS | `filters[field][$eq]=value`, `sort[0]=field:asc`, `pagination[page]=N&pagination[pageSize]=N` |

Per-driver guides — wire format, supported operators, response parsing, customisation — live on the [docs site](https://ng-qubee.andreatantimonaco.me/docs/getting-started).

## Quick start

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { DriverEnum, NgQubeeService, provideNgQubee, SortEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.STRAPI })]
});

// In a component or service:
constructor(private _qb: NgQubeeService) {}

this._qb
  .setResource('articles')
  .addFilter('status', 'published')
  .addSort('createdAt', SortEnum.DESC)
  .setLimit(10)
  .generateUri()
  .subscribe(uri => console.log(uri));
// → /articles?filters[status][$eq]=published&sort[0]=createdAt:desc&pagination[page]=1&pagination[pageSize]=10
```

The full query-builder API, pagination helpers, per-driver feature matrices, and TypeScript types are documented at [ng-qubee.andreatantimonaco.me](https://ng-qubee.andreatantimonaco.me).

## License

MIT © [Andrea Tantimonaco](https://www.linkedin.com/in/andrea-tantimonaco/)

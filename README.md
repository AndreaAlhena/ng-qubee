<p align="center">
  <img width="500" height="500" src="https://i.ibb.co/LdXRKyG/logo.png">
</p>

# Your next Angular Query Builder 🐝

[![CI](https://github.com/AndreaAlhena/ng-qubee/workflows/CI/badge.svg)](https://github.com/AndreaAlhena/ng-qubee/actions)
[![codecov](https://codecov.io/gh/AndreaAlhena/ng-qubee/branch/master/graph/badge.svg)](https://codecov.io/gh/AndreaAlhena/ng-qubee)
[![npm version](https://badge.fury.io/js/ng-qubee.svg)](https://www.npmjs.com/package/ng-qubee)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NgQubee is a Query Builder for Angular. Easily compose your API requests without the hassle of writing the wheel again :)

- Easily retrieve URIs with a Service
- Pagination ready
- Reactive, as the results are emitted with a RxJS Observable
- Developed with a test-driven approach
- **Multi-driver support**: JSON:API, Laravel (pagination-only), Spatie Query Builder, and NestJS (nestjs-paginate)

## We love it, we use it ❤️
NgQubee uses some open source projects to work properly:
-  [rxjs] - URIs returned via Observables
-  [qs] - A querystring parsing and stringifying library with some added security.

And of course NgQubee itself is open source with a [public repository][ng-qubee] on GitHub.

## Requirements

NgQubee requires:
- **Angular**: >=16.0.0 <22.0.0 (supports Angular 16 through 21)
- **RxJS**: ^6.5.0 || ^7.0.0

> **Note**: Angular 16+ is required because NgQubee uses Angular Signals for state management.

## Installation
Install NgQubee via NPM

```sh
npm  i  ng-qubee
```

## Drivers

NgQubee supports five drivers out of the box. A driver **must** be specified in the configuration:

| Driver | Backend | Request Format | Response Format |
|---|---|---|---|
| **JSON:API** | Any JSON:API-compliant backend | `filter[field]=value`, `sort=-field`, `page[number]=N&page[size]=N` | Nested: `{ data, meta: {...}, links: {...} }` |
| **Laravel** | Plain Laravel pagination | `limit=N&page=N` (pagination only) | Flat: `{ data, current_page, total, ... }` |
| **Spatie** | Spatie Query Builder | `filter[field]=value`, `sort=-field` | Flat: `{ data, current_page, total, ... }` |
| **NestJS** | nestjs-paginate | `filter.field=$operator:value`, `sortBy=field:DESC` | Nested: `{ data, meta: {...}, links: {...} }` |
| **PostgREST** | PostgREST / Supabase | `col=eq.value`, `order=col.asc`, `limit=N&offset=M` | Bare array body + `Content-Range` header for total |

## Usage

### JSON:API Driver

The JSON:API driver generates URIs compatible with any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir, etc.):

```typescript
import { DriverEnum } from 'ng-qubee';

// Standalone approach
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.JSON_API })]
});

// Module approach
@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.JSON_API })
  ]
})
export class AppModule {}
```

The JSON:API driver supports:

-  **Filters** are composed as `filter[field]=value`
-  **Fields** are composed as `fields[type]=col1,col2`
-  **Includes** are composed as `include=author,comments.author`
-  **Sort** is composed as `sort=-created_at,name` (`-` prefix = DESC)
-  **Pagination** uses bracket notation: `page[number]=1&page[size]=15`

### Laravel Driver (pagination-only)

The Laravel driver provides basic pagination — limit and page parameters only. No filters, sorts, fields, or includes are supported.

```typescript
import { DriverEnum } from 'ng-qubee';

// Standalone approach
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.LARAVEL })]
});

// Module approach
@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.LARAVEL })
  ]
})
export class AppModule {}
```

### Spatie Driver

The Spatie driver generates URIs compatible with [Spatie Laravel Query Builder](https://spatie.be/docs/laravel-query-builder):

```typescript
import { DriverEnum } from 'ng-qubee';

// Standalone approach
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
});

// Module approach
@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.SPATIE })
  ]
})
export class AppModule {}
```

The object given to the _forRoot_ method allows to customize the query param keys. Following, the default behaviour:

-  **Filters** are composed as filter[fieldName]=value / customizable with {request: {filters: 'yourFilterKey'}}
-  **Fields** are composed as fields[model]=id,email,username / customizable with {request: {fields: 'yourFieldsKey'}}
-  **Includes** are composed as include=modelA, modelB / customizable with {request: {includes: 'yourIncludeKey'}}
-  **Limit** is composed as limit=15 / customizable with {request: {limit: 'yourLimitKey'}}
-  **Page** is composed as page=1 / customizable with {request: {page: 'yourPageKey'}}
-  **Sort** is composed as sort=fieldName / customizable with {request: {sort: 'yourSortKey'}}

As you can easily imagine, everything that regards the URI composition is placed into the "request" key.

```typescript
NgQubeeModule.forRoot({
  driver: DriverEnum.SPATIE,
  request: {
    filters: 'custom-filter-key',
    fields: 'custom-fields-key',
    /* and so on... */
  }
})
```

### NestJS Driver

To use the NestJS driver, specify the driver in your configuration:

```typescript
import { DriverEnum } from 'ng-qubee';

// Standalone approach
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.NESTJS })]
});

// Module approach
@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.NESTJS })
  ]
})
export class AppModule {}
```

The NestJS driver generates URIs compatible with [nestjs-paginate](https://github.com/ppetzold/nestjs-paginate):

-  **Filters** are composed as `filter.field=value`
-  **Filter operators** are composed as `filter.field=$operator:value`
-  **Sorts** are composed as `sortBy=field:ASC,field2:DESC`
-  **Select** is composed as `select=col1,col2`
-  **Search** is composed as `search=term`
-  **Limit** is composed as `limit=15`
-  **Page** is composed as `page=1`

### PostgREST / Supabase Driver

The PostgREST driver generates URIs compatible with [PostgREST](https://postgrest.org/) and anything built on top of it (notably [Supabase](https://supabase.com/)):

```typescript
import { DriverEnum } from 'ng-qubee';

// Standalone approach
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.POSTGREST })]
});

// Module approach
@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.POSTGREST })
  ]
})
export class AppModule {}
```

The PostgREST driver supports:

-  **Filters** (single value) are composed as `col=eq.value`
-  **Filters** (multi-value) are composed as `col=in.(v1,v2,v3)` — PostgREST's native IN-list syntax
-  **Sorts** are composed as `order=col1.asc,col2.desc`
-  **Select** is composed as `select=col1,col2`
-  **Limit** is composed as `limit=15`
-  **Offset** is derived from `page` and `limit` (`offset=(page-1)*limit`) — omitted on page 1

#### Reading totals from the `Content-Range` header

PostgREST returns a bare array body and reports the total row count in the `Content-Range` HTTP response header (e.g. `0-9/50`). Opt in by sending `Prefer: count=exact` on the request, then pass the headers to `paginate()`:

```typescript
this._http.get<User[]>(uri, {
  observe: 'response',
  headers: { 'Prefer': 'count=exact' }
}).subscribe(response => {
  const collection = this._paginationService.paginate(response.body, response.headers);
  // collection.total, collection.page, collection.lastPage are populated
});
```

The second argument to `paginate()` accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>` — whatever shape your HTTP client emits. If you omit the header (or the server returns `Content-Range: 0-9/*`), the collection still populates `data` and `page` but leaves `total` / `lastPage` undefined — the pagination helpers' conservative defaults then kick in (`hasNextPage()` returns `true`, `isLastPage()` returns `false`).

#### Feature matrix

The MVP driver intentionally leaves a few features out. They throw the existing `Unsupported*Error` classes so the limitation is explicit:

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Implicit `eq`; multi-value becomes `in.(...)` |
| `addSort` / `deleteSorts` | ✓ | Emits `order=col.asc,col.desc` |
| `addSelect` / `deleteSelect` | ✓ | Flat column selection |
| `setLimit` / `setPage` | ✓ | `offset` derived from `page` |
| `addFilterOperator` / `deleteOperatorFilters` | ✗ | Throws `UnsupportedFilterOperatorError`. Follow-up issue planned to map the NestJS-shaped `FilterOperatorEnum` to PostgREST's prefix operators. |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | Throws `UnsupportedFieldSelectionError`. Per-type field selection is a JSON:API/Spatie concept; use `addSelect` for PostgREST's column pruning. |
| `addIncludes` / `deleteIncludes` | ✗ | Throws `UnsupportedIncludesError`. PostgREST uses embedded resources via `select=col,rel(*)`; a dedicated API is tracked as a follow-up. |
| `setSearch` / `deleteSearch` | ✗ | Throws `UnsupportedSearchError`. PostgREST's `fts`/`plfts`/`phfts`/`wfts` operators are column-scoped; a dedicated API is planned. |

### Per-component instances

By default, `provideNgQubee()` / `NgQubeeModule.forRoot()` register `NgQubeeService` at the environment injector, so every component that injects it shares the same query-builder state. If you need a dedicated instance — e.g. a feature component whose filters and pagination must not bleed into the app-wide one — spread `provideNgQubeeInstance()` into the component's `providers`:

```typescript
import { Component } from '@angular/core';
import { NgQubeeService, provideNgQubeeInstance } from 'ng-qubee';

@Component({
  selector: 'app-product-list',
  standalone: true,
  providers: [...provideNgQubeeInstance()],
  template: '...'
})
export class ProductListComponent {
  constructor(private _qb: NgQubeeService) {}
}
```

The component gets its own `NgQubeeService`, `NestService`, and `PaginationService`. The driver, strategies, and options are inherited from the environment injector configured by `provideNgQubee()` — you still configure the library once at bootstrap.

## Query Builder API

For composing queries, the first step is to inject the proper NgQubeeService:

```typescript
@Injectable()
export  class  YourService  {
  constructor(private  _ngQubeeService:  NgQubeeService)  {}
}
```

Set the **resource** to run the query against:

```typescript
this._ngQubeeService.setResource('users');
```

This is necessary to build the prefix of the URI (/users)


### Fields (JSON:API + Spatie)
Fields can be selected as following:

```typescript
this._ngQubeeService.addFields('users', ['id',  'email']);
```

Will output _/users?fields[users]=id,email_

### Select (NestJS only)
Flat field selection for the NestJS driver:

```typescript
this._ngQubeeService.addSelect('id', 'name', 'email');
```

Will output _/users?select=id,name,email_

### Filters (JSON:API + Spatie + NestJS)
Filters are applied as following:

```typescript
this._ngQubeeService.addFilter('id',  5);
```

Will output:
- Spatie: _/users?filter[id]=5_
- NestJS: _/users?filter.id=5_

Multiple values are allowed too:

```typescript
this._ngQubeeService.addFilter('id',  5,  7,  10);
```

Will output:
- Spatie: _/users?filter[id]=5,7,10_
- NestJS: _/users?filter.id=5,7,10_

### Filter Operators (NestJS only)
The NestJS driver supports explicit filter operators:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

// Equality
this._ngQubeeService.addFilterOperator('status', FilterOperatorEnum.EQ, 'active');
// Output: filter.status=$eq:active

// Greater than or equal
this._ngQubeeService.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
// Output: filter.age=$gte:18

// In (multiple values)
this._ngQubeeService.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);
// Output: filter.id=$in:1,2,3

// Between
this._ngQubeeService.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 100);
// Output: filter.price=$btw:10,100

// Case-insensitive like
this._ngQubeeService.addFilterOperator('name', FilterOperatorEnum.ILIKE, 'john');
// Output: filter.name=$ilike:john
```

**Available operators:** `$eq`, `$not`, `$null`, `$in`, `$gt`, `$gte`, `$lt`, `$lte`, `$btw`, `$ilike`, `$sw`, `$contains`

### Includes (JSON:API + Spatie)
Ask to include related models with:

```typescript
this._ngQubeeService.addIncludes('profile',  'settings');
```

Will output _/users?include=profile,settings_

### Search (NestJS only)
Full-text search for the NestJS driver:

```typescript
this._ngQubeeService.setSearch('john doe');
```

Will output _/users?search=john doe_

### Sort (JSON:API + Spatie + NestJS)
Sort elements as following:

```typescript
import { SortEnum } from 'ng-qubee';

this._ngQubeeService.addSort('fieldName', SortEnum.ASC);
```

Will output:
- Spatie: _/users?sort=fieldName_ (or _/users?sort=-fieldName_ if DESC)
- NestJS: _/users?sortBy=fieldName:ASC_ (or _/users?sortBy=fieldName:DESC_ if DESC)

The `SortEnum` provides two ordering options:
- `SortEnum.ASC` - Ascending order
- `SortEnum.DESC` - Descending order

### Page and Limit
NgQubee supports paginated queries:

```typescript
this._ngQubeeService.setLimit(25);
this._ngQubeeService.setPage(2);
```

Will output _/users?limit=25&page=2

Default values are automatically added to the query:
-  **Limit**: 15
-  **Page**: 1

Always expect your query to include _limit=15&page=1_

#### Fetch all (NestJS only)

When the active driver is NestJS, `setLimit(-1)` is accepted as a "fetch all items" sentinel, following the [nestjs-paginate](https://github.com/ppetzold/nestjs-paginate) convention (the server must opt in via `maxLimit: -1`):

```typescript
// NestJS driver only
this._ngQubeeService.setLimit(-1);
```

JSON:API, Laravel, and Spatie drivers reject `-1` and throw `InvalidLimitError`.

#### Limit validation

Limit validation is driver-scoped — each request strategy enforces its own accepted range and invalid values throw `InvalidLimitError` immediately when passed to `setLimit()`:

| Driver | Accepted limit values |
|---|---|
| NestJS | integer `-1` (fetch all) or `>= 1` |
| JSON:API / Laravel / Spatie | integer `>= 1` |

Non-integer values, zero, negative numbers (other than `-1` for NestJS), `NaN`, and `Infinity` are all rejected.

#### Auto-reset of page on result-set-changing mutations

Any mutation that changes *which records* the server would return also resets `state.page` to `1` automatically. Staying on page 5 of an old result set after changing filters is almost always a bug, so the library makes the reset explicit:

| Resets page to 1 | Does NOT reset page |
|---|---|
| `setLimit()` | `setBaseUrl()` |
| `setResource()` | `setPage()` |
| `setSearch()` / `deleteSearch()` | `addFields()` / `deleteFields()` / `deleteFieldsByModel()` |
| `addFilter()` / `deleteFilters()` | `addIncludes()` / `deleteIncludes()` |
| `addFilterOperator()` / `deleteOperatorFilters()` | `addSelect()` / `deleteSelect()` |
| `addSort()` / `deleteSorts()` | |

Rule of thumb: if a mutation changes the record *set* (filters, sort, search, limit, resource), page resets. If it only changes the record *shape* (fields, includes, select), page stays. If you intentionally want to keep the previous page number, call `setPage(n)` again after the mutation.

### Pagination navigation

The service exposes a fluent navigation surface so you can wire a standard paginator UI (Prev / N of M / Next) with no manual bookkeeping. All navigation methods return `this` and can be chained.

```typescript
this._ngQubeeService.nextPage().generateUri().subscribe(uri => /* fire the request */);
this._ngQubeeService.previousPage();
this._ngQubeeService.firstPage();
this._ngQubeeService.lastPage();
this._ngQubeeService.goToPage(3);
```

#### Auto-sync from `PaginationService.paginate()`

When you hand a paginated response to `PaginationService.paginate()`, the library automatically copies the response's `page` and `lastPage` back into the query-builder state. That means `lastPage()`, `goToPage(n)` bounds checks, and the predicates below become accurate immediately — you don't thread the collection's `lastPage` back in yourself.

```typescript
this._paginationService.paginate(response); // auto-writes page + lastPage
this._ngQubeeService.lastPage();            // now safe; jumps to the last page
```

The auto-sync only flips `isLastPageKnown` to `true` when the response carries a **positive integer** `lastPage`. Server-emitted `0` (empty collection) and absent fields leave the flag `false` — the helpers fall back to their conservative defaults.

#### Predicates and accessors

Template-safe methods for driving button disable-states and labels:

```typescript
qb.isFirstPage();     // true on page 1
qb.isLastPage();      // true only when bounds known and page === lastPage
qb.hasNextPage();     // true when bounds unknown, or page < lastPage
qb.hasPreviousPage(); // true when page > 1
qb.currentPage();     // state.page (always safe)
qb.totalPages();      // state.lastPage (throws if never synced)
```

Angular template wiring:

```html
<button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
<span>Page {{ qb.currentPage() }} of {{ qb.totalPages() }}</span>
<button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
```

For the `qb.totalPages()` template usage above, either call `paginate()` at least once before the template renders, or guard the display with `*ngIf="qb.hasNextPage() || !qb.isFirstPage()"` / by reading `qb.nest().isLastPageKnown` directly.

#### Error behavior

| Helper | Throws | When |
|---|---|---|
| `nextPage()` | — | Never throws. No-op when already at `lastPage` (bounds known). |
| `previousPage()` | — | Never throws. No-op at page 1. |
| `firstPage()` | — | Never throws. |
| `lastPage()` | `PaginationNotSyncedError` | `paginate()` has never run (`state.isLastPageKnown` is `false`). |
| `goToPage(n)` | `InvalidPageNumberError` | `n` is not a positive integer, or exceeds `lastPage` when bounds are known. |
| `isFirstPage()` / `isLastPage()` / `hasNextPage()` / `hasPreviousPage()` | — | Template-safe. Conservative defaults when bounds unknown. |
| `currentPage()` | — | Always safe. |
| `totalPages()` | `PaginationNotSyncedError` | `paginate()` has never run. Guard with `nest().isLastPageKnown` for a non-throwing check. |

#### Guarding the imperative "jump to last" button

`lastPage()` and `totalPages()` need a synced response. A safe pattern:

```html
<button
  [disabled]="!qb.nest().isLastPageKnown || qb.isLastPage()"
  (click)="qb.lastPage()">
  Last
</button>
```

The `isLastPageKnown` read short-circuits before `qb.lastPage()` could throw.

### Retrieving data
URI is generated invoking the _generateUri_ method of the NgQubeeService. An observable is returned and the URI will be emitted:

```typescript
this._ngQubeeService.generateUri().subscribe(uri  => console.log(uri));
```

### Deleting State

All query features have corresponding delete methods:

```typescript
// JSON:API + Spatie + NestJS
this._ngQubeeService.deleteFilters('status', 'role');
this._ngQubeeService.deleteSorts('created_at');

// JSON:API + Spatie only
this._ngQubeeService.deleteFields({ users: ['email'] });
this._ngQubeeService.deleteFieldsByModel('users', 'email');
this._ngQubeeService.deleteIncludes('profile');

// NestJS only
this._ngQubeeService.deleteOperatorFilters('age');
this._ngQubeeService.deleteSelect('email');
this._ngQubeeService.deleteSearch();
```

### Reset state
Query Builder state can be cleaned with the reset method. This will clean up everything set up previously, including the current resource, filters, includes and so on...

```typescript
this._ngQubeeService.reset();
```

### Driver Validation

Calling a method that is not supported by the active driver throws a descriptive error immediately:

| Method | JSON:API | Laravel | Spatie | NestJS |
|---|---|---|---|---|
| `addFilter()` / `deleteFilters()` | supported | throws `UnsupportedFilterError` | supported | supported |
| `addSort()` / `deleteSorts()` | supported | throws `UnsupportedSortError` | supported | supported |
| `addFields()` / `deleteFields()` / `deleteFieldsByModel()` | supported | throws `UnsupportedFieldSelectionError` | supported | throws `UnsupportedFieldSelectionError` |
| `addIncludes()` / `deleteIncludes()` | supported | throws `UnsupportedIncludesError` | supported | throws `UnsupportedIncludesError` |
| `addFilterOperator()` / `deleteOperatorFilters()` | throws `UnsupportedFilterOperatorError` | throws `UnsupportedFilterOperatorError` | throws `UnsupportedFilterOperatorError` | supported |
| `addSelect()` / `deleteSelect()` | throws `UnsupportedSelectError` | throws `UnsupportedSelectError` | throws `UnsupportedSelectError` | supported |
| `setSearch()` / `deleteSearch()` | throws `UnsupportedSearchError` | throws `UnsupportedSearchError` | throws `UnsupportedSearchError` | supported |

## Pagination
If you are working with an API that supports pagination, we have got you covered 😉 NgQubee provides:
- A PaginatedCollection class that holds paginated data
- A PaginationService that help to transform the response in a PaginatedCollection

As a service, you have to inject the PaginationService first:

```typescript
constructor(private _pg: PaginationService) {}
```

In the following example, the PaginationService is used to transform the response with the paginate method.

```typescript
this._pg.paginate<Model>({  ...response,  data: response.data.map(e  =>  new  Model(e.id)) })
```

The "paginate" method returns a PaginatedCollection that helps handling paginated data. Additionally, if you are dealing with a state library in your application, you can use the "normalize" method of the collection to normalize the data.

### Laravel / Spatie Response Format

When using the Laravel or Spatie driver, the paginated collection will check for the following keys in the response:

- data - the key that holds the response data
- current_page - requested page for the pagination
- from - Showing items from n
- to - Showing items to n
- total - Count of the items available in the whole pagination
- per_page - Items per page
- prev_page_url - URL to the previous page
- next_page_url - URL to the next page
- last_page - Last page number
- first_page_url - URL to the first page
- last_page_url - URL to the last page

### JSON:API Response Format

When using the JSON:API driver, the PaginationService automatically parses nested responses:

```json
{
  "data": [...],
  "meta": {
    "current-page": 1,
    "per-page": 10,
    "total": 100,
    "page-count": 10
  },
  "links": {
    "first": "http://api.com/articles?page[number]=1&page[size]=10",
    "prev": null,
    "next": "http://api.com/articles?page[number]=2&page[size]=10",
    "last": "http://api.com/articles?page[number]=10&page[size]=10"
  }
}
```

The `from` and `to` values are computed automatically from `current-page` and `per-page` when not present in the response. JSON:API meta key names vary by implementation; defaults can be fully customised via response configuration.

### NestJS Response Format

When using the NestJS driver, the PaginationService automatically parses nested responses:

```json
{
  "data": [...],
  "meta": {
    "currentPage": 1,
    "totalItems": 100,
    "itemsPerPage": 10,
    "totalPages": 10
  },
  "links": {
    "first": "http://api.com/users?page=1",
    "previous": null,
    "next": "http://api.com/users?page=2",
    "last": "http://api.com/users?page=10",
    "current": "http://api.com/users?page=1"
  }
}
```

The `from` and `to` values are computed automatically from `currentPage` and `itemsPerPage` when not present in the response.

### Customizing Response Keys

Just like the query builder, the pagination service supports customizable keys. While invoking the forRoot method of the module, use the response key to look for different keys in the API response:

```typescript
// Spatie
NgQubeeModule.forRoot({
  driver: DriverEnum.SPATIE,
  response:  {
    currentPage:  'pg'
  }
})

// NestJS (use dot-notation for nested paths)
NgQubeeModule.forRoot({
  driver: DriverEnum.NESTJS,
  response:  {
    currentPage:  'pagination.page',
    total: 'pagination.total'
  }
})
```

## TypeScript Support

NgQubee is fully typed and exports all public interfaces, enums, and types for TypeScript users.

### Available Enums

```typescript
import { DriverEnum, FilterOperatorEnum, SortEnum } from 'ng-qubee';

// Driver options
DriverEnum.JSON_API // 'json-api'
DriverEnum.LARAVEL  // 'laravel' (pagination only)
DriverEnum.SPATIE   // 'spatie'
DriverEnum.NESTJS   // 'nestjs'

// Sorting options
SortEnum.ASC  // 'asc'
SortEnum.DESC // 'desc'

// Filter operators (NestJS only)
FilterOperatorEnum.EQ       // '$eq'
FilterOperatorEnum.NOT      // '$not'
FilterOperatorEnum.NULL     // '$null'
FilterOperatorEnum.IN       // '$in'
FilterOperatorEnum.GT       // '$gt'
FilterOperatorEnum.GTE      // '$gte'
FilterOperatorEnum.LT       // '$lt'
FilterOperatorEnum.LTE      // '$lte'
FilterOperatorEnum.BTW      // '$btw'
FilterOperatorEnum.ILIKE    // '$ilike'
FilterOperatorEnum.SW       // '$sw'
FilterOperatorEnum.CONTAINS // '$contains'
```

### Available Interfaces

NgQubee exports the following interfaces for type-safe development:

#### Configuration Interfaces

```typescript
import {
  IConfig,
  IQueryBuilderConfig,
  IPaginationConfig
} from 'ng-qubee';

// Main configuration interface (driver is required)
const config: IConfig = {
  driver: DriverEnum.NESTJS,
  request: {
    filters: 'custom-filter-key',
    fields: 'custom-fields-key',
    includes: 'custom-include-key',
    limit: 'custom-limit-key',
    page: 'custom-page-key',
    sort: 'custom-sort-key'
  },
  response: {
    currentPage: 'pg',
    data: 'items',
    total: 'count',
    perPage: 'itemsPerPage'
  }
};
```

#### Query Building Interfaces

```typescript
import {
  IFilters,
  IFields,
  ISort,
  IOperatorFilter
} from 'ng-qubee';

// Filters interface - key-value pairs with array values
const filters: IFilters = {
  id: [1, 2, 3],
  status: ['active', 'pending']
};

// Fields interface - model name with array of field names
const fields: IFields = {
  users: ['id', 'email', 'username'],
  profile: ['avatar', 'bio']
};

// Sort interface - field and order
const sort: ISort = {
  field: 'created_at',
  order: SortEnum.DESC
};

// Operator filter interface (NestJS only)
const operatorFilter: IOperatorFilter = {
  field: 'age',
  operator: FilterOperatorEnum.GTE,
  values: [18]
};
```

#### Strategy Interfaces

```typescript
import {
  IRequestStrategy,
  IResponseStrategy
} from 'ng-qubee';
```

### Spatie Usage Example

```typescript
import { Component, OnInit } from '@angular/core';
import {
  NgQubeeService,
  SortEnum,
  IFilters,
  IFields
} from 'ng-qubee';

@Component({
  selector: 'app-users',
  template: '...'
})
export class UsersComponent implements OnInit {
  constructor(private ngQubee: NgQubeeService) {}

  ngOnInit(): void {
    // Set up the query with type safety
    this.ngQubee.setResource('users');

    // Define fields with type checking
    const userFields: IFields = {
      users: ['id', 'email', 'username']
    };
    this.ngQubee.addFields('users', userFields.users);

    // Define filters with type checking
    const filters: IFilters = {
      status: ['active'],
      role: ['admin', 'moderator']
    };
    this.ngQubee.addFilter('status', ...filters.status);
    this.ngQubee.addFilter('role', ...filters.role);

    // Add sorting with enum
    this.ngQubee.addSort('created_at', SortEnum.DESC);

    // Generate URI
    this.ngQubee.generateUri().subscribe(uri => {
      console.log(uri);
      // Output: /users?fields[users]=id,email,username&filter[status]=active&filter[role]=admin,moderator&sort=-created_at&limit=15&page=1
    });
  }
}
```

### NestJS Usage Example

```typescript
import { Component, OnInit } from '@angular/core';
import {
  NgQubeeService,
  PaginationService,
  FilterOperatorEnum,
  SortEnum
} from 'ng-qubee';

@Component({
  selector: 'app-users',
  template: '...'
})
export class UsersComponent implements OnInit {
  constructor(
    private ngQubee: NgQubeeService,
    private pagination: PaginationService
  ) {}

  ngOnInit(): void {
    this.ngQubee
      .setResource('users')
      .addFilterOperator('age', FilterOperatorEnum.GTE, 18)
      .addFilter('status', 'active')
      .addSelect('id', 'name', 'email')
      .addSort('name', SortEnum.ASC)
      .setSearch('john')
      .setLimit(10)
      .setPage(1);

    this.ngQubee.generateUri().subscribe(uri => {
      console.log(uri);
      // Output: /users?filter.status=active&filter.age=$gte:18&sortBy=name:ASC&select=id,name,email&search=john&limit=10&page=1
    });
  }
}
```

[ng-qubee]:  <https://github.com/AndreaAlhena/ng-qubee>
[rxjs]:  <https://reactivex.io>
[qs]:  <https://github.com/ljharb/qs>

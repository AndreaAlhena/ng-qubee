---
sidebar_position: 3
title: Query Builder API
---

# Query Builder API

Every fluent method on `NgQubeeService`. All methods that mutate state return `this` for chaining; capability methods return values without mutating.

Driver compatibility is gated at runtime — calling an unsupported method throws an `Unsupported*Error`. The per-driver pages list which methods each driver accepts.

## State setup

### `setResource(name)`

Required before any URI generation. Becomes the first path segment.

```typescript
qb.setResource('users');     // → /users…
```

Triggers an [auto-reset of `page`](#auto-reset-of-page).

### `setBaseUrl(url)`

Optional. Prepends a base URL (e.g. `https://api.example.com`) to every generated URI.

```typescript
qb.setBaseUrl('https://api.example.com');     // → https://api.example.com/users…
```

Does not trigger auto-reset (URL prefix only).

### `setLimit(n)` / `setPage(n)`

Pagination position.

```typescript
qb.setLimit(25).setPage(2);   // 25 items, page 2
```

`setLimit` triggers auto-reset of `page`. `setPage` of course does not. NestJS additionally accepts `setLimit(-1)` as the [fetch-all sentinel](./drivers/nestjs.md#fetch-all).

## Filters

### `addFilter(field, ...values)` / `deleteFilters(...fields)`

Simple key-value filters. Multi-value calls merge per field.

```typescript
qb.addFilter('status', 'active');           // single
qb.addFilter('id', 1, 2, 3);                // multi-value
qb.deleteFilters('status');                  // remove
```

Spatie / JSON:API: `filter[status]=active`. NestJS: `filter.status=active`. PostgREST: `status=eq.active` (single) or `status=in.(1,2,3)` (multi).

Triggers auto-reset.

### `addFilterOperator(field, operator, ...values)` / `deleteOperatorFilters(...fields)`

Filters with explicit comparison operators. NestJS and PostgREST only.

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);
```

The full operator list: `EQ`, `NOT`, `NULL`, `IN`, `GT`, `GTE`, `LT`, `LTE`, `BTW`, `ILIKE`, `SW`, `CONTAINS`. PostgREST adds `FTS`, `PLFTS`, `PHFTS`, `WFTS`. See the [PostgREST page](./drivers/postgrest.md#operator-filters) for detailed mappings.

Triggers auto-reset.

## Sorting

### `addSort(field, order)` / `deleteSorts(...fields)`

```typescript
import { SortEnum } from 'ng-qubee';

qb.addSort('created_at', SortEnum.DESC);
qb.addSort('name', SortEnum.ASC);
qb.deleteSorts('created_at');
```

Spatie / JSON:API: `sort=-created_at,name`. NestJS: `sortBy=created_at:DESC,name:ASC`. PostgREST: `order=created_at.desc,name.asc`.

Triggers auto-reset.

## Column selection

### `addSelect(...fields)` / `deleteSelect(...fields)` — NestJS / PostgREST

Flat column list:

```typescript
qb.addSelect('id', 'email', 'name');     // select=id,email,name
```

Does **not** trigger auto-reset (column shape change, not record-set change).

### `addFields(model, fields)` / `deleteFields({ model: [...] })` / `deleteFieldsByModel(model, ...fields)` — JSON:API / Spatie

Per-model selection:

```typescript
qb.addFields('users', ['id', 'email']);                      // fields[users]=id,email
qb.deleteFields({ users: ['email'] });
qb.deleteFieldsByModel('users', 'email');
```

Does **not** trigger auto-reset.

## Includes — JSON:API / Spatie

### `addIncludes(...models)` / `deleteIncludes(...models)`

```typescript
qb.addIncludes('profile', 'posts');     // include=profile,posts
qb.deleteIncludes('profile');
```

Does **not** trigger auto-reset (related-resource shape, not record set).

## Search — NestJS only

### `setSearch(term)` / `deleteSearch()`

```typescript
qb.setSearch('john doe');     // search=john doe
qb.deleteSearch();
```

Triggers auto-reset.

## Auto-reset of `page`

Several mutations reset `state.page` to `1` automatically because they invalidate the current page position:

- `setLimit` (page count changes)
- `setResource` (different record set)
- `setSearch` / `deleteSearch` (different record set)
- `addFilter` / `deleteFilters` (different record set)
- `addFilterOperator` / `deleteOperatorFilters` (different record set)
- `addSort` / `deleteSorts` (different ordering)

Methods that change record *shape* (`addFields`, `addIncludes`, `addSelect`, `setBaseUrl`) leave `page` untouched.

## Lifecycle

### `generateUri()`

Returns an `Observable<string>` that emits the composed URI:

```typescript
qb.generateUri().subscribe(uri => /* … */);
```

URIs do not auto-emit on state mutations — call `generateUri()` explicitly when you want the next URI.

### `reset()`

Resets state to defaults (clears all filters, sorts, fields, includes, sets `page=1`, `limit=15`):

```typescript
qb.reset();
```

## Pagination navigation

See [Pagination](./pagination.md) for `nextPage`, `previousPage`, `firstPage`, `lastPage`, `goToPage`, `currentPage`, `totalPages`, `isFirstPage`, `isLastPage`, `hasNextPage`, `hasPreviousPage`, `paginationHeaders`.

---
sidebar_position: 3
title: Fetching data
---

# Fetching data

`ng-qubee` builds the URI and parses the response, but it deliberately stays out of the HTTP layer — you bring your own `HttpClient`. This page shows how to wire the three pieces together in a typical service class.

The example assumes the **Spatie driver**, but the flow is identical for JSON:API, NestJS, and Laravel. The PostgREST variant differs only in passing headers to `paginate()` — see the [end of the page](#variant-postgrest--supabase).

## A complete `UserClient` service

```typescript title="user-client.service.ts"
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, switchMap, take, map } from 'rxjs';

import {
  NgQubeeService,
  PaginationService,
  PaginatedCollection,
  SortEnum
} from 'ng-qubee';

/** Domain model — what the API returns for each user record */
export interface User {
  id: number;
  email: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class UserClient {

  private readonly _qb = inject(NgQubeeService);
  private readonly _pagination = inject(PaginationService);
  private readonly _http = inject(HttpClient);

  /**
   * Fetch a paginated list of users
   *
   * @param page - 1-indexed page number; defaults to the current page in state
   * @returns The parsed PaginatedCollection<User>
   */
  public list(page?: number): Observable<PaginatedCollection<User>> {
    this._qb.setResource('users')
            .addSort('created_at', SortEnum.DESC);

    if (page !== undefined) {
      this._qb.goToPage(page);
    }

    return this._fetch();
  }

  /**
   * Fetch only active users matching a free-text search
   */
  public search(term: string): Observable<PaginatedCollection<User>> {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addFilter('name', term);

    return this._fetch();
  }

  /**
   * Convenience for "next page of whatever the previous query returned"
   *
   * Relies on the auto-sync that PaginationService.paginate() performs on
   * NestService — after the first list() call, state.lastPage is known and
   * nextPage() is bounds-aware.
   */
  public next(): Observable<PaginatedCollection<User>> {
    this._qb.nextPage();
    return this._fetch();
  }

  /**
   * Shared fetch primitive — generate URI → HTTP GET → parse → emit
   *
   * @returns The parsed PaginatedCollection<User>
   */
  private _fetch(): Observable<PaginatedCollection<User>> {
    return this._qb.generateUri().pipe(
      take(1),
      switchMap(uri => this._http.get<unknown>(uri)),
      map(body => this._pagination.paginate<User>(body as Record<string, unknown>))
    );
  }
}
```

### What's happening

1. **`setResource(...)`, `addFilter(...)`, etc.** mutate the query state on `NestService`. They return `this` for chaining and don't fire HTTP themselves.
2. **`generateUri()`** emits the composed URI through the `uri$` observable. We `take(1)` because we only want the URI for *this* call.
3. **`HttpClient.get<unknown>(uri)`** does the actual network call. The `unknown` type is intentional — your driver decides how to interpret the body, and that's what `paginate()` does next.
4. **`paginationService.paginate<User>(body)`** parses the response into a typed `PaginatedCollection<User>` and auto-syncs `page` + `lastPage` back into `NestService` so navigation helpers like `nextPage()` immediately know their bounds.

## Wiring it into a component

```typescript title="user-list.component.ts"
import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';

import { PaginatedCollection } from 'ng-qubee';

import { User, UserClient } from './user-client.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (users$ | async; as page) {
      <ul>
        @for (u of page.data; track u.id) {
          <li>{{ u.name }} — {{ u.email }}</li>
        }
      </ul>

      <button [disabled]="page.page <= 1" (click)="prev()">Prev</button>
      <span>Page {{ page.page }} of {{ page.lastPage }}</span>
      <button [disabled]="page.page >= (page.lastPage ?? Infinity)" (click)="next()">Next</button>
    }
  `
})
export class UserListComponent implements OnInit {

  protected users$!: Observable<PaginatedCollection<User>>;

  private readonly _client = inject(UserClient);

  public ngOnInit(): void {
    this.users$ = this._client.list();
  }

  protected next(): void {
    this.users$ = this._client.next();
  }

  protected prev(): void {
    // Symmetric helper omitted from UserClient for brevity — same shape as next()
    this._client['_qb'].previousPage();
    this.users$ = this._client['_fetch']();
  }
}
```

Wiring `nextPage()` / `previousPage()` directly on `NgQubeeService` from the template — without going through the client service — also works if you bind to the service directly. The template-safe predicates (`hasNextPage()`, `isLastPage()`) make the disable-state declarations even cleaner; see [Pagination](./pagination.md#predicates-template-safe).

## Variant: PostgREST / Supabase

PostgREST returns a bare array body and reports the total count in the `Content-Range` HTTP header. Two things change:

```typescript
private _fetch(): Observable<PaginatedCollection<User>> {
  return this._qb.generateUri().pipe(
    take(1),
    switchMap(uri => this._http.get<User[]>(uri, {
      observe: 'response',                          // ← keep the full response
      headers: { 'Prefer': 'count=exact' }          // ← ask PostgREST for the total
    })),
    map(response => this._pagination.paginate<User>(
      response.body as unknown as Record<string, unknown>,
      response.headers                              // ← pass headers to paginate()
    ))
  );
}
```

When `IConfig.pagination` is set to `PaginationModeEnum.RANGE`, also merge in `paginationHeaders()`:

```typescript
const extra = this._qb.paginationHeaders() ?? {};   // null on every other driver
this._http.get<User[]>(uri, {
  observe: 'response',
  headers: { 'Prefer': 'count=exact', ...extra }
});
```

`paginationHeaders()` returns `null` for all drivers other than PostgREST in RANGE mode, so spreading the result is safe even on the Spatie / NestJS / JSON:API path.

## Per-component-scoped client

The `UserClient` above injects the **app-wide** `NgQubeeService` (provided at root by `provideNgQubee()`). For a feature component that shouldn't share its filter / pagination state with the rest of the app, scope the services at the component:

```typescript
import { provideNgQubeeInstance } from 'ng-qubee';

@Component({
  selector: 'app-product-list',
  standalone: true,
  providers: [
    ...provideNgQubeeInstance(),
    UserClient                                       // ← component-scoped too
  ]
})
export class ProductListComponent { /* … */ }
```

`UserClient` is now constructed by the component's injector and inherits the dedicated `NgQubeeService` + `PaginationService` from `provideNgQubeeInstance()`. State stays isolated. See [Per-component instances](./per-component-instances.md) for the full picture.

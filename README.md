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
- **Multi-driver support**: Laravel (Spatie Query Builder) and NestJS (nestjs-paginate)

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

NgQubee supports two pagination drivers out of the box:

| Driver | Backend | Request Format | Response Format |
|---|---|---|---|
| **Laravel** (default) | Spatie Query Builder | `filter[field]=value`, `sort=-field` | Flat: `{ data, current_page, total, ... }` |
| **NestJS** | nestjs-paginate | `filter.field=$operator:value`, `sortBy=field:DESC` | Nested: `{ data, meta: {...}, links: {...} }` |

## Usage

### Laravel Driver (default)

Import the module in your Angular app:

```typescript
@NgModule({
  imports: [
    NgQubeeModule.forRoot({}) // You can omit the empty object as it is an optional argument
  ]
})
export class AppModule  {}
```

Or if you are working with Angular 15 or greater, use the provide function:
```typescript
const config = {};

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee(config)]
});
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

## Query Builder API

For composing queries, the first step is to inject the proper NgQubeeService:

```typescript
@Injectable()
export  class  YourService  {
  constructor(private  _ngQubeeService:  NgQubeeService)  {}
}
```

Set the **model** to run the query against:

```typescript
this._ngQubeeService.setModel('users');
```

This is necessary to build the prefix of the URI (/users)


### Fields (Laravel only)
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

### Filters
Filters are applied as following:

```typescript
this._ngQubeeService.addFilter('id',  5);
```

Will output:
- Laravel: _/users?filter[id]=5_
- NestJS: _/users?filter.id=5_

Multiple values are allowed too:

```typescript
this._ngQubeeService.addFilter('id',  5,  7,  10);
```

Will output:
- Laravel: _/users?filter[id]=5,7,10_
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

### Includes (Laravel only)
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

### Sort
Sort elements as following:

```typescript
import { SortEnum } from 'ng-qubee';

this._ngQubeeService.addSort('fieldName', SortEnum.ASC);
```

Will output:
- Laravel: _/users?sort=fieldName_ (or _/users?sort=-fieldName_ if DESC)
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

### Retrieving data
URI is generated invoking the _generateUri_ method of the NgQubeeService. An observable is returned and the URI will be emitted:

```typescript
this._ngQubeeService.generateUri().subscribe(uri  => console.log(uri));
```

### Deleting State

All query features have corresponding delete methods:

```typescript
// Both drivers
this._ngQubeeService.deleteFilters('status', 'role');
this._ngQubeeService.deleteSorts('created_at');

// Laravel only
this._ngQubeeService.deleteFields({ users: ['email'] });
this._ngQubeeService.deleteFieldsByModel('users', 'email');
this._ngQubeeService.deleteIncludes('profile');

// NestJS only
this._ngQubeeService.deleteOperatorFilters('age');
this._ngQubeeService.deleteSelect('email');
this._ngQubeeService.deleteSearch();
```

### Reset state
Query Builder state can be cleaned with the reset method. This will clean up everything set up previously, including the current model, filters, includes and so on...

```typescript
this._ngQubeeService.reset();
```

### Driver Validation

Calling a method that is not supported by the active driver throws a descriptive error immediately:

| Method | Laravel | NestJS | Error |
|---|---|---|---|
| `addFields()` / `deleteFields()` / `deleteFieldsByModel()` | supported | throws `UnsupportedFieldSelectionError` | Use `addSelect()` instead |
| `addIncludes()` / `deleteIncludes()` | supported | throws `UnsupportedIncludesError` | Not supported |
| `addFilterOperator()` / `deleteOperatorFilters()` | throws `UnsupportedFilterOperatorError` | supported | Use `addFilter()` instead |
| `addSelect()` / `deleteSelect()` | throws `UnsupportedSelectError` | supported | Use `addFields()` instead |
| `setSearch()` / `deleteSearch()` | throws `UnsupportedSearchError` | supported | Not supported |

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

### Laravel Response Format

By default (Laravel driver), the paginated collection will check for the following keys in the response:

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
// Laravel
NgQubeeModule.forRoot({
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
DriverEnum.LARAVEL  // 'laravel' (default)
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

// Main configuration interface
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

### Usage Example with Full Types

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
    this.ngQubee.setModel('users');

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
      .setModel('users')
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

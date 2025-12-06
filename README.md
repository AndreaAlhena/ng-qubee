<p align="center">
  <img width="500" height="500" src="https://i.ibb.co/LdXRKyG/logo.png">
</p>

# Your next Angular Query Builder 🐝
NgQubee is a Query Builder for Angular. Easily compose your API requests without the hassle of writing the wheel again :)

- Easily retrieve URIs with a Service
- Pagination ready
- Reactive, as the results are emitted with a RxJS Observable
- Developed with a test-driven approach

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

## Usage
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


### Fields
Fields can be selected as following:

```typescript
this._ngQubeeService.addFields('users', ['id',  'email']);
```

Will output _/users?fields[users]=id,email_

### Filters
Filters are applied as following:

```typescript
this._ngQubeeService.addFilter('id',  5);
```

Will output _/users?filter[id]=5_

Multiple values are allowed too:

```typescript
this._ngQubeeService.addFilter('id',  5,  7,  10);
```

Will output _/users?filter[id]=5,7,10_

  

### Includes
Ask to include related models with:

```typescript
this._ngQubeeService.addIncludes('profile',  'settings');
```

Will output _/users?include=profile,settings_

### Sort
Sort elements as following:

```typescript
import { SortEnum } from 'ng-qubee';

this._ngQubeeService.addSort('fieldName', SortEnum.ASC);
```

Will output _/users?sort=fieldName_ (or _/users?sort=-fieldName_ if DESC)

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

### Reset state
Query Builder state can be cleaned with the reset method. This will clean up everything set up previously, including the current model, filters, includes and so on...

```typescript
this._ngQubeeService.reset();
```

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

As you can see from the example, the paginate method requires a generic type: put there your model and you'll be provided with a PaginatedCollection<Model>. By default, the paginated collection will check for the following keys in the response:

- data - the key that holds the response data
- currentPage - requested page for the pagination
- from - Showing items from n (where n is a number)
- to - Showing items from n (where n is a number)
- total - Count of the items available in thw whole pagination
- perPage - Items per page
- prevPageUrl - Url to the previous page
- nextPageUrl - Url to the next page
- lastPage - Last page number
- firstPageUrl - Url to the first page
- lastPageUrl - Url to the last page

Just like the query builder, the pagination service supports customizable keys. While invoking the forRoot method of the module, use the response key to look for different keys in the API response. Let's assume that the "currentPage" key is named "pg" in your API responseL your forRoot configuration will look as following:

```typescript
NgQubeeModule.forRoot({
  response:  {
    currentPage:  'pg'
  }
})
```

Feel free to customize your PaginationService as you need, using the keys shown in the upper list.

## TypeScript Support

NgQubee is fully typed and exports all public interfaces, enums, and types for TypeScript users.

### Available Enums

```typescript
import { SortEnum } from 'ng-qubee';

// Sorting options
SortEnum.ASC  // 'asc'
SortEnum.DESC // 'desc'
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
  ISort
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
```

#### Pagination Interfaces

```typescript
import { IPaginatedObject } from 'ng-qubee';

// Use with your model type
interface User {
  id: number;
  email: string;
  username: string;
}

// The paginated object can contain any additional keys
const paginatedData: IPaginatedObject = {
  data: [/* users */],
  currentPage: 1,
  total: 100,
  perPage: 15
};
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

[ng-qubee]:  <https://github.com/AndreaAlhena/ng-qubee>
[rxjs]:  <https://reactivex.io>
[qs]:  <https://github.com/ljharb/qs>

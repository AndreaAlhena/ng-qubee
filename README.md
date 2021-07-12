# NgQubee 🐝
## Your next Angular Query Builder

NgQubee is an NGRX (store based) Query Builder for Angular. Easily compose your API requests without the hassle of writing the wheel again :)

- Retrieve URIs easily with a Service
- Pagination ready
- Reactive, as the results are emitted with a RxJS Observable
- Developed with a test-driven approach

## We love it, we use it ❤️

NgQubee uses a number of open source projects to work properly:

- [ngrx] - Store based with NGRX
- [rxjs] - URIs returned via Observables
- [qs] - A querystring parsing and stringifying library with some added security.

And of course NgQubee itself is open source with a [public repository][ng-qubee] on GitHub.

## Installation

Install NgQubee via NPM

```sh
npm i ng-qubee
```
## Usage
Import the module in your Angular app:
```typescript
@NgModule({
    imports: [
        NgQubeeModule.forRoot({})
    ]
})
export class AppModule {}
```

The object given to the _forRoot_ method allows to customize the query param keys. Following, the default behaviour:
  - **Filters** are composed as filter[fieldName]=value / customizable with {filter: 'yourFilterKey'}
  - **Fields** are composed as fields[model]=id,email,username / customizable with {fields: 'yourFieldsKey'}
  - **Includes** are composed as include=modelA, modelB / customizable with {includes: 'yourIncludeKey'}
  - **Limit** is composed as limit=15 / customizable with {limit: 'yourLimitKey'}
  - **Page** is composed as page=1 / customizable with {page: 'yourPageKey'}
  - **Sort** is composed as sort=fieldName / customizable with {sort: 'yourSortKey'}
  
For composing queries, the first step is to inject the proper NgQubeeService:
```typescript
@Injectable
export class YourService {
    constructor(private _ngQubeeService: NgQubeeService) {}
}
```

Set the **model** to run the query against:
```typescript
    this._ngQubeeService.setModel('users');
```

This is necessary to build the left part of the URI (/users)

### Fields
Fields can be selected as following:

```typescript
this._ngQubeeService.addFields('users', ['id', 'email']);
```
Will output _/users?fields[users]=id,email_

### Filters
Filters are applied as following:

```typescript
this._ngQubeeService.addFilter('id', 5);
```
Will output _/users?filter[id]=5_

Multiple values are allowed too:
```typescript
this._ngQubeeService.addFilter('id', 5, 7, 10);
```

Will output _/users?filter[id]=5,7,10_

### Includes
Ask to include related models with:

```typescript
this._ngQubeeService.addIncludes('profile', 'settings');
```

Will output _/users?include=profile,settings_

### Sort
Sort elements as following:

```typescript
this._ngQubeeService.addSort('fieldName', SortEnum.ASC);
```

Will output _/users?sort=fieldName_ (or _/users?sort=-fieldName_ if DESC)

### Page and Limit
NgQubee supports paginated queries:

```typescript
this._ngQubeeService.setLimit(25);
this._ngQubeeService.setPage(2);
```

Will output _/users?limit=25&page=2

Default values are automatically added to the query:
  - **Limit**: 15
  - **Page**: 1

Always expect your query to include _limit=15&page=1_

### Retrieving data
URI is generated invoking the _generateUri_ method of the NgQubeeService. An observable is returned and the URI will be emitted:

```typescript
this._ngQubeeService.generateUri().subscribe(uri => console.log(uri));
```

### Reset state
Query Builder state can be cleaned with the reset method. This will clean up everything set up previously, including the current model, filters, includes and so on...

```typescript
this._ngQubeeService.reset();
```
   [ng-qubee]: <https://github.com/AndrewReborn/ng-qubee>
   [ngrx]: <https://ngrx.io>
   [rxjs]: <https://reactivex.io>
   [qs]: <https://github.com/ljharb/qs>
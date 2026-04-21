# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BEHAVIOR CHANGE — auto-reset `page` to 1 on result-set-changing mutations** (#65): `setLimit()`, `setResource()`, `setSearch()`, `deleteSearch()`, `addFilter()`, `deleteFilters()`, `addFilterOperator()`, `deleteOperatorFilters()`, `addSort()`, and `deleteSorts()` now internally reset `state.page` to `1` after mutating. Rationale: staying on page 5 of an old result set after a filter/sort/limit/search change is almost always a bug. **Migration:** if your code relied on `page` persisting across one of these mutations, call `setPage(n)` explicitly afterwards. Methods that change the record *shape* (`addFields`, `addIncludes`, `addSelect`, etc.) do NOT reset `page` — unchanged behavior.
- `NgQubeeService`, `NestService`, and `PaginationService` are now `@Injectable()` and constructed by Angular DI from tokens instead of a closure-captured `useFactory`. `provideNgQubee()` and `NgQubeeModule.forRoot()` still accept the same `IConfig` and behave identically at the root level; the refactor unlocks component-scoped instances (#64)
- `NgQubeeService` constructor now takes a pre-built `QueryBuilderOptions` (was `IQueryBuilderConfig`); `PaginationService` constructor now takes a pre-built `ResponseOptions` (was `IPaginationConfig`). Both default to a fresh empty instance when omitted. Affects direct manual construction only — the `provideNgQubee()` entry point is unchanged
- `PaginationService.paginate()` now auto-syncs the parsed `page` and `lastPage` back into `NestService` (#65), so pagination navigation helpers on `NgQubeeService` work without consumer bookkeeping. Only positive integer `lastPage` values flip the `isLastPageKnown` flag; server-emitted `0` (empty-collection edge case) and absent fields leave the flag `false`

### Added
- **Per-component service instances** (#64): new `provideNgQubeeInstance()` helper returns a provider array for use in a standalone component's `providers: [...]`, yielding a dedicated `NgQubeeService` + `NestService` + `PaginationService` whose state does not bleed with the app-wide instance. Driver, strategies, and options are inherited from the environment injector, so the library is still configured once at bootstrap via `provideNgQubee()` / `NgQubeeModule.forRoot()`
- Public `InjectionToken`s backing the DI wiring: `NG_QUBEE_DRIVER`, `NG_QUBEE_REQUEST_STRATEGY`, `NG_QUBEE_REQUEST_OPTIONS`, `NG_QUBEE_RESPONSE_STRATEGY`, `NG_QUBEE_RESPONSE_OPTIONS`
- **Pagination navigation helpers on `NgQubeeService`** (#65): `nextPage()`, `previousPage()`, `firstPage()`, `lastPage()`, `goToPage(n)` — fluent navigation methods that return `this`. `nextPage()` / `previousPage()` are idempotent at bounds; `lastPage()` and `goToPage(n)` enforce bounds when known
- **Pagination state predicates and accessors on `NgQubeeService`** (#65): `isFirstPage()`, `isLastPage()`, `hasNextPage()`, `hasPreviousPage()`, `currentPage()`, `totalPages()`. Predicates are template-safe with conservative defaults when pagination bounds have not yet been synced. `totalPages()` throws `PaginationNotSyncedError` before the first `paginate()` call
- **Pagination state tracking** (#65): `IQueryBuilderState` gains `lastPage: number` and `isLastPageKnown: boolean` fields, populated automatically by `PaginationService.paginate()`
- `PaginationNotSyncedError` — new public error class thrown by `lastPage()` and `totalPages()` when called before any paginated response has been synced into state. Exported from the library root

## [3.1.0] - 2026-04-18

### Added
- **JSON:API Driver** (`DriverEnum.JSON_API`): New driver implementing the [JSON:API specification](https://jsonapi.org/format/) for any compliant backend (Rails, Django, .NET, Java, Elixir, etc.)
  - `JsonApiRequestStrategy`: Bracket pagination (`page[number]=1&page[size]=15`), bracket filters (`filter[field]=value`), comma-separated sorts with `-` prefix, per-type field selection (`fields[type]=col1,col2`), and includes (`include=author,comments.author`)
  - `JsonApiResponseStrategy`: Parses nested `meta` and `links` envelope with dot-notation path support and automatic `from`/`to` computation
  - `JsonApiResponseOptions`: Pre-configured response key defaults (`meta.current-page`, `meta.per-page`, `meta.total`, `meta.page-count`, `links.first`, `links.prev`, `links.next`, `links.last`)
- JSON:API driver supports fields, filters, includes, and sorts (same feature set as Spatie)
- **Fetch-all pagination for NestJS** (#63): `setLimit(-1)` is now accepted on the NestJS driver and honors nestjs-paginate's convention for returning all items in a single response (server must opt-in via `maxLimit: -1`)

### Changed
- **Driver-scoped limit validation** (#63): Limit validation moved from `NestService` into each `IRequestStrategy` via a new `validateLimit(limit: number): void` contract. The NestJS strategy accepts integer `-1` or `>= 1`; Laravel, Spatie, and JSON:API strategies continue to accept integer `>= 1`. `NgQubeeService.setLimit()` now delegates to the active strategy's validator, so invalid values throw `InvalidLimitError` at call time
- `InvalidLimitError` message now reflects which values are accepted by the active driver (adds "or -1 to fetch all items" for drivers that support the sentinel)

### Internal
- Removed dead `@Inject` string tokens and `@Injectable()` decorator from `NgQubeeService` and `PaginationService` constructors (services are instantiated via `useFactory`, not Angular DI)

## [3.0.0] - 2026-04-12

### Added
- **Three-Driver Support**: Introduced a driver-based strategy pattern supporting Laravel, Spatie Query Builder, and NestJS backends
  - `DriverEnum.LARAVEL` - Pagination-only driver (limit + page)
  - `DriverEnum.SPATIE` - Spatie Query Builder format with filters, sorts, fields, and includes
  - `DriverEnum.NESTJS` - NestJS paginate format with operator filters, search, and flat select
- **Spatie Request/Response Strategy**: Full URI generation and response parsing for Spatie Query Builder format (previously named "Laravel")
  - Bracket-notation filters: `filter[field]=value`
  - Sort format: `sort=field` / `sort=-field`
  - Per-model field selection: `fields[model]=col1,col2`
  - Includes: `include=model1,model2`
- **NestJS Request Strategy**: Full URI generation for nestjs-paginate format
  - Dot-notation filters: `filter.field=value`
  - Operator filters: `filter.field=$operator:value` with 12 operators (`$eq`, `$not`, `$null`, `$in`, `$gt`, `$gte`, `$lt`, `$lte`, `$btw`, `$ilike`, `$sw`, `$contains`)
  - Sort format: `sortBy=field:ASC,field2:DESC`
  - Flat field selection: `select=col1,col2`
  - Full-text search: `search=term`
- **NestJS Response Strategy**: Nested response parsing for nestjs-paginate format
  - Parses `meta` (currentPage, totalItems, itemsPerPage, totalPages) and `links` (first, previous, next, last)
  - Automatic `from`/`to` computation from pagination metadata
  - Dot-notation path support for custom response key mapping
- **FilterOperatorEnum**: Enum with all 12 nestjs-paginate filter operators
- **IOperatorFilter Interface**: Typed operator filter configuration
- **IRequestStrategy / IResponseStrategy**: Strategy interfaces for extensibility
- **Driver Validation Errors**: Seven specific error classes for driver-incompatible method calls
  - `UnsupportedFilterError` - `addFilter()`/`deleteFilters()` with Laravel
  - `UnsupportedSortError` - `addSort()`/`deleteSorts()` with Laravel
  - `UnsupportedFieldSelectionError` - `addFields()`/`deleteFields()` with NestJS/Laravel
  - `UnsupportedIncludesError` - `addIncludes()`/`deleteIncludes()` with NestJS/Laravel
  - `UnsupportedFilterOperatorError` - `addFilterOperator()`/`deleteOperatorFilters()` with Spatie/Laravel
  - `UnsupportedSelectError` - `addSelect()`/`deleteSelect()` with Spatie/Laravel
  - `UnsupportedSearchError` - `setSearch()`/`deleteSearch()` with Spatie/Laravel
- **New Public API Methods**:
  - `setResource(name)` - Set the API resource (replaces `setModel()`)
  - `addFilterOperator(field, operator, ...values)` - Add operator filter (NestJS)
  - `addSelect(...fields)` - Add flat field selection (NestJS)
  - `setSearch(term)` - Set search term (NestJS)
  - `deleteOperatorFilters(...fields)` - Remove operator filters (NestJS)
  - `deleteSelect(...fields)` - Remove select fields (NestJS)
  - `deleteSearch()` - Clear search term (NestJS)
- **NestService State Extensions**: `operatorFilters`, `search`, `select` fields in query builder state
- **Test Coverage**: Comprehensive tests (257 total) covering all drivers, driver validation, and strategy logic
- **Documentation**: Updated README with three-driver table, migration guide, and per-driver examples

### Changed
- **[Breaking]** `setModel()` renamed to `setResource()` — "model" implied ORM semantics; "resource" better reflects the API path
- **[Breaking]** `IQueryBuilderState.model` renamed to `IQueryBuilderState.resource`
- **[Breaking]** `InvalidModelNameError` renamed to `InvalidResourceNameError`
- **[Breaking]** `driver` is now **required** in `IConfig` — no default driver
- **[Breaking]** `NgQubeeService` constructor now requires `requestStrategy` and `driver` parameters (injected via DI)
- **[Breaking]** `PaginationService` constructor now requires `responseStrategy` parameter (injected via DI)
- **[Breaking]** `addFilter()`, `deleteFilters()`, `addSort()`, `deleteSorts()` now throw `UnsupportedFilterError` / `UnsupportedSortError` when used with the Laravel driver
- **IQueryBuilderState** extended with `operatorFilters`, `search`, `select` fields
- **IQueryBuilderConfig** extended with `search`, `select`, `sortBy` keys
- `QueryBuilderOptions` extended with `search`, `select`, `sortBy` properties
- `provideNgQubee()` and `NgQubeeModule.forRoot()` now resolve strategies based on `config.driver`
- URI generation and response parsing extracted into strategy classes

### Internal
- Refactored URI generation into `SpatieRequestStrategy`, `LaravelRequestStrategy`, and `NestjsRequestStrategy`
- Refactored response parsing into `SpatieResponseStrategy`, `LaravelResponseStrategy`, and `NestjsResponseStrategy`
- Added `NestjsResponseOptions` class for NestJS-specific response key defaults
- `_assertDriver()` refactored to accept an array of allowed drivers

### Migration Guide (2.x → 3.0)

1. **Choose a driver** — `driver` is now required:
   ```typescript
   // Before (2.x)
   provideNgQubee({})
   // After (3.0) — use SPATIE for the same behavior as the old LARAVEL default
   provideNgQubee({ driver: DriverEnum.SPATIE })
   ```
2. **Rename `setModel()` → `setResource()`**:
   ```typescript
   // Before
   this.ngQubee.setModel('users');
   // After
   this.ngQubee.setResource('users');
   ```
3. **Error class rename**: `InvalidModelNameError` → `InvalidResourceNameError`
4. **Laravel driver is now pagination-only** — if you were using filters, sorts, fields, or includes with the old `DriverEnum.LARAVEL`, switch to `DriverEnum.SPATIE`

## [2.1.0] - 2025-12-06

### Added
- **Test Coverage**: Comprehensive test suite expansion to >90% coverage
  - 37 new edge case tests covering empty arrays/objects, boundary values, string edge cases, multiple operations, and deletion edge cases
  - 10 new integration tests covering complete workflows, modification/deletion sequences, and signal reactivity
  - Tests for complex multi-model scenarios and state immutability verification
- **Previously Commented Tests**: Implemented and enabled previously commented tests
  - Added baseUrl functionality test to verify URL generation with base URL prepending
  - Added UnselectableModelError test to verify proper error handling for invalid field selections
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing and quality checks
  - Automated linting with ESLint on every PR and push
  - Automated test execution with code coverage reporting
  - Automated build verification to ensure package builds successfully
  - Coverage reports integration with Codecov
  - Parallel job execution for faster CI feedback
  - Build artifact upload for verification
  - Added status badges to README (CI, Codecov, npm version, License)
- **Standalone CI Support**: Project can now run tests and builds independently
  - Added `angular.json` for standalone Angular CLI configuration
  - Added base `tsconfig.json` for independent TypeScript compilation
  - Added all necessary devDependencies for standalone development
- **Developer Experience**:
  - Pre-commit hook with Husky and lint-staged for automatic linting
  - Dependabot configuration for automated dependency updates
  - Auto-merge workflow for minor/patch dependency updates
- **Documentation**:
  - Added CONTRIBUTING.md with development setup and PR guidelines
  - Added SECURITY.md with vulnerability reporting process

### Fixed
- **BaseUrl Support**: Fixed `_prepend()` method in NgQubeeService to properly prepend baseUrl when generating URIs
  - URIs now correctly include the base URL when set via `setBaseUrl()`
  - Example: `setBaseUrl('https://api.example.com')` now produces `https://api.example.com/users?...`
- **DeleteSorts Bug**: Fixed `deleteSorts()` method in NestService to correctly remove all specified sorts
  - Method now searches for sort indices in the working array instead of the computed signal
  - Fixes issue where deleting multiple sorts would fail to remove all items
- **Error Handling in generateUri()**: Fixed `generateUri()` method to properly handle synchronous errors as Observable errors
  - Wrapped `_parse()` call in try-catch to convert thrown errors into Observable errors
  - Errors like `UnselectableModelError` are now properly caught by Observable error handlers
- **CI Fixes**: Multiple fixes for standalone CI execution
  - Fixed lint job directory path
  - Fixed tsconfig paths for standalone builds
  - Fixed karma coverage output path
  - Restored missing `throwError` import

## [2.0.5] - 2025-12-04

### Added
- **Input Validation**: Added robust input validation with custom error classes
  - `InvalidModelNameError` - Thrown when model name is empty, null, undefined, or whitespace-only
  - `InvalidPageNumberError` - Thrown when page is not a positive integer (must be >= 1)
  - `InvalidLimitError` - Thrown when limit is not a positive integer (must be >= 1)
  - Validation occurs in setters for `model`, `page`, and `limit` properties
- **Documentation**: Comprehensive JSDoc comments added to all public methods in NestService
  - Added `@example` tags demonstrating real-world usage for each method
  - Documented error scenarios with `@throws` tags
  - Improved parameter descriptions with concrete examples
- Comprehensive test suite for duplicate prevention with 9 new test cases covering edge cases
- Deep cloning tests with 5 new test cases to verify immutability of state operations
- Input validation tests with 18 new test cases covering all validation scenarios

### Fixed
- **Duplicate Prevention**: `addFields()`, `addFilters()`, and `addIncludes()` now automatically prevent duplicate values
  - `addFields()` prevents duplicate field names for each model
  - `addFilters()` prevents duplicate filter values for each filter key
  - `addIncludes()` prevents duplicate include values
  - All methods now use Set-based deduplication for efficient duplicate removal
- **Deep Cloning**: Fixed shallow clone issues in `deleteFields()` and `deleteFilters()` methods
  - `deleteFields()` now uses deep cloning via `_clone()` method to prevent state mutations
  - `deleteFilters()` now uses deep cloning via `_clone()` method to prevent state mutations
  - Prevents accidental mutations to the original state when deleting items

### Removed
- Removed commented dead code from ng-qubee.service.ts (incomplete `_removeArgIfEmpty` method)

## [2.0.4] - 2025-12-03

### Added
- ESLint configuration with @angular-eslint for modern linting
- ESLint flat config format (eslint.config.mjs) for ESLint v9 compatibility
- npm scripts for linting: `npm run lint` and `npm run lint:fix`
- Comprehensive ESLint rules for TypeScript and Angular best practices
- Template accessibility linting rules
- **peerDependencies** for `@angular/core` (>=16.0.0 <22.0.0) and `rxjs` (^6.5.0 || ^7.0.0)
- Repository metadata in package.json (repository, bugs, homepage)
- Keywords for better npm discoverability (angular, query-builder, api, pagination, rxjs, filter, typescript, signals)

### Changed
- **[Breaking]** Migrated from deprecated TSLint to ESLint
- **[Breaking]** Minimum Angular version is now 16.0.0 (due to Signals API usage)
- Updated `qs` from 6.11.2 to 6.14.0
- Updated `@types/qs` from 6.9.11 to 6.14.0
- Updated `tslib` from 2.3.0 to 2.8.1
- Updated `karma-firefox-launcher` from 2.1.1 to 2.1.3
- Updated TypeScript compilation target from ES2015 to ES2020 for better modern JavaScript support
- Updated TypeScript lib from ES2018 to ES2020

### Removed
- TSLint configuration (tslint.json) - replaced with ESLint
- Unused import `IQueryBuilderConfig` in response-options.ts
- Unused import `EnvironmentProviders` in provide-ngqubee.spec.ts
- Deprecated `enableIvy: false` from tsconfig.lib.json (Ivy is now the default and only option)
- Deprecated `skipTemplateCodegen` option from Angular compiler options
- Deprecated `fullTemplateTypeCheck` option from Angular compiler options

### Fixed
- ESLint warnings for intentional use of `any` type in flexible API interfaces
- Naming convention issues in test files for API response mocks
- Code formatting and style consistency across the codebase

### Security
- Zero vulnerabilities reported by npm audit
- All dependencies updated to latest secure versions

### Developer Experience
- Added ESLint disable comments for legitimate edge cases
- Improved code quality with modern linting standards
- Better TypeScript strict mode compatibility

## [2.0.3] - 2024-02-15

### Fixed
- Readme correction
- Proper dist folder name
- Wrong import statement
- npm wrong published package

## [2.0.2] - Previous Release

[3.0.0]: https://github.com/AndreaAlhena/ng-qubee/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/AndreaAlhena/ng-qubee/compare/v2.0.5...v2.1.0
[2.0.5]: https://github.com/AndreaAlhena/ng-qubee/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/AndreaAlhena/ng-qubee/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/AndreaAlhena/ng-qubee/releases/tag/v2.0.3

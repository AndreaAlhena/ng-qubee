# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[2.0.4]: https://github.com/AndreaAlhena/ng-qubee/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/AndreaAlhena/ng-qubee/releases/tag/v2.0.3

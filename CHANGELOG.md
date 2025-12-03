# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2025-12-03

### Added
- ESLint configuration with @angular-eslint for modern linting
- ESLint flat config format (eslint.config.mjs) for ESLint v9 compatibility
- npm scripts for linting: `npm run lint` and `npm run lint:fix`
- Comprehensive ESLint rules for TypeScript and Angular best practices
- Template accessibility linting rules

### Changed
- **[Breaking]** Migrated from deprecated TSLint to ESLint
- Updated `qs` from 6.11.2 to 6.14.0
- Updated `@types/qs` from 6.9.11 to 6.14.0
- Updated `tslib` from 2.3.0 to 2.8.1
- Updated `karma-firefox-launcher` from 2.1.1 to 2.1.3

### Removed
- TSLint configuration (tslint.json) - replaced with ESLint
- Unused import `IQueryBuilderConfig` in response-options.ts
- Unused import `EnvironmentProviders` in provide-ngqubee.spec.ts

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

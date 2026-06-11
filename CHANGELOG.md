# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **PostgREST embedded resources** (#66): new fluent methods `addEmbedded(relation, ...columns)` / `deleteEmbedded(...relations)` on `NgQubeeService`, exposing PostgREST's idiomatic join mechanism (`select=col,rel(col1,col2)`).
  - Embedded fragments are **spliced into the single `select=` query parameter** alongside flat columns from `addSelect` — never emitted as a second `select`. With embedded relations but no flat select, the flat part defaults to `*` so the base row's columns stay in the projection (`select=*,author(*)`).
  - `addEmbedded('author')` with no columns emits `author(*)`; repeated calls for the same relation merge-dedup the columns; `deleteEmbedded` removes the whole relation entry; `reset()` clears the map. Neither method resets the page (column shape change, not record-set change).
  - `IQueryBuilderState` gains an `embedded` field (new public `Embedded` type, `{ [relation: string]: string[] }`), and `IStrategyCapabilities` gains an `embedded` flag — `true` only on the PostgREST strategy. All other drivers throw the new public `UnsupportedEmbeddedError`.
  - Out of scope (per issue): nested embedding (`author(posts(*))`), filtering on embedded columns, ordering by embedded columns.

- **OData driver** (`DriverEnum.ODATA`) (#49): new driver targeting [OData v4](https://www.odata.org/) — the OASIS-standard query protocol of the Microsoft/.NET ecosystem (ASP.NET Core OData, SAP, Microsoft Graph).
  - `OdataRequestStrategy`: single `$filter=` parameter holding ` and `-joined expression-language terms — simple single-value filters fold to `eq` (`status eq 'active'`), multi-value filters fold to the v4.01 `in` list operator (`status in ('active','pending')`); `$orderby=field asc,other desc` CSV sorts; `$select=col1,col2` projection; `$expand=` combining bare relations from `addIncludes` and inline-projected ones from `addEmbedded` (`rel($select=col1,col2)`); `$search=term` free-text search; offset pagination as `$top=N&$skip=M` (skip derived from the 1-indexed page, omitted on page 1) plus a constant `$count=true` so responses carry the total. The `$`-prefixed system query option names are fixed by the spec and ignore `IConfig.request` overrides. String literals are single-quoted with embedded quotes doubled (`name eq 'O''Brien'`); numbers and booleans emit bare.
  - `OdataResponseStrategy`: parses the `{ "@odata.count", "@odata.nextLink", "value" }` envelope. The body names no current page or page size, so both are **derived from the `@odata.nextLink`** URL: `perPage` from its `$top` (falling back to the on-page item count), `currentPage` as `$skip ÷ perPage`, `lastPage` as `ceil(total ÷ perPage)`. Without a usable link (last page, or `$skiptoken` server-driven paging) the page falls back to 1 — guaranteed correct only for single-page results. Relative `nextLink` values are handled. Envelope keys contain literal dots, so they are read with flat bracket access (no dot-path traversal).
  - OData driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `addSelect`/`deleteSelect`, `addIncludes`/`deleteIncludes`, `addEmbedded`/`deleteEmbedded`, `setSearch`/`deleteSearch`, `setLimit`/`setPage` + their delete counterparts — the broadest capability set so far. Only `addFields` throws (`UnsupportedFieldSelectionError`: no per-model field selection in OData).
- **OData `FilterOperatorEnum` mapping** (#49): `EQ`→`eq`, `GT`/`GTE`/`LT`/`LTE`→`gt`/`ge`/`lt`/`le`, `CONTAINS`→`contains(field,'val')`, `ILIKE`→`contains(tolower(field),tolower('val'))`, `SW`→`startswith(field,'val')`, `IN`→`field in (…)`, `BTW`→two AND-ed terms `field ge min and field le max` (arity-checked), `NOT`→one `ne` term per value (AND-ed), `NULL`→`eq null`/`ne null` (boolean dispatch). PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` throw `UnsupportedFilterOperatorError`.
- **`OdataResponseOptions`** (new class) (#49): pre-configured key mapping for the OData envelope (`data → 'value'`, `total → '@odata.count'`, `nextPageUrl → '@odata.nextLink'`); derived fields default to empty paths; all keys overridable via `IPaginationConfig`.

- **Directus driver** (`DriverEnum.DIRECTUS`) (#52): new driver targeting [Directus](https://directus.io/) — the open-source headless CMS / data platform with underscore-prefixed operators inside a nested bracket filter syntax.
  - `DirectusRequestStrategy`: nested bracket filters — simple single-value filters fold to `filter[field][_eq]=value`, multi-value to `filter[field][_in]=v1,v2` (CSV); simple and operator filters on the same field merge under one `filter[field]` block; `sort=-created_at,name` CSV sorts; a single `fields=` CSV combining flat columns from `addSelect`, whole relations from `addIncludes` (`rel.*`), and column-projected relations from `addEmbedded` (`rel.col` — with relations but no flat select the flat part defaults to `*`); `search=term` global search; page-based pagination (`limit=N&page=N`, 1-indexed) plus a constant `meta=total_count,filter_count` so responses carry totals. The `filter`/`sort`/`fields`/`search`/`limit`/`page` keys honour `IConfig.request` overrides; `meta` is fixed. Directus' `deep[...]` query options and nested relation filtering are out of scope.
  - `DirectusResponseStrategy`: parses the `{ data, meta: { total_count, filter_count } }` envelope. `total` defaults to **`meta.filter_count`** (the count matching the current filter — the relevant total for paging; point the path at `meta.total_count` for the unfiltered size). The envelope names no current page or page size, so `page` falls back to 1 (guaranteed correct only for single-page results) and `lastPage`/`from`/`to` resolve only when the response provably holds the whole filtered set — or when paths are pointed at a custom wrapper that does include paging fields (dot notation supported).
  - Directus driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `addSelect`/`deleteSelect`, `addIncludes`/`deleteIncludes`, `addEmbedded`/`deleteEmbedded`, `setSearch`/`deleteSearch`, `setLimit`/`setPage` + their delete counterparts. Only `addFields` throws (`UnsupportedFieldSelectionError`: relational projection uses dot paths, not a `fields[model]` map).
- **Directus `FilterOperatorEnum` mapping** (#52): `EQ`/`GT`/`GTE`/`LT`/`LTE`→`_eq`/`_gt`/`_gte`/`_lt`/`_lte`, `CONTAINS`→`_contains`, `ILIKE`→`_icontains`, `SW`→`_starts_with`, `IN`→`_in` (CSV), `BTW`→`_between` with `min,max` (arity-checked), `NOT`→`_neq` (single) / `_nin` (multi, CSV), `NULL`→`_null=true`/`_nnull=true` (boolean dispatch). PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` throw `UnsupportedFilterOperatorError`.
- **`DirectusResponseOptions`** (new class) (#52): pre-configured key mapping for the Directus envelope (`data → 'data'`, `total → 'meta.filter_count'`); paging fields default to empty paths; all keys overridable via `IPaginationConfig`.

### Fixed
- **Options classes exported from the public API** (#73): `QueryBuilderOptions`, `ResponseOptions`, and the driver-specific `ResponseOptions` subclasses (`DrfResponseOptions`, `JsonApiResponseOptions`, `NestjsResponseOptions`, `NestjsxCrudResponseOptions`, `SieveResponseOptions`, `SpringResponseOptions`, `StrapiResponseOptions`) were documented as public but never exported from `public-api.ts`. The exported `NG_QUBEE_REQUEST_OPTIONS` / `NG_QUBEE_RESPONSE_OPTIONS` tokens can now be typed by consumers without deep imports.

## [3.6.0] - 2026-06-10

### Added
- **@nestjsx/crud driver** (`DriverEnum.NESTJSX_CRUD`) (#44): new driver targeting [@nestjsx/crud](https://github.com/nestjsx/crud) for NestJS.
  - `NestjsxCrudRequestStrategy`: pipe-delimited repeatable filters (`filter=field||$eq||value` single, `filter=field||$in||v1,v2` multi-value), repeatable `sort=field,ASC` sorts (uppercase direction), flat `fields=col1,col2` selection, repeatable `join=relation` for related resources, page-based pagination (`page=N&limit=N`).
  - `NestjsxCrudResponseStrategy`: parses the flat `{ data, count, total, page, pageCount }` getMany envelope; computes `from`/`to` from page × count. `count` is the on-page entity count, so derived indices can underestimate on a partial last page (documented).
  - @nestjsx/crud driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `addSelect`/`deleteSelect` (mapped to `fields`), `addIncludes`/`deleteIncludes` (mapped to `join`), `setLimit`/`setPage` + their delete counterparts. `addFields` and `setSearch` throw the matching `Unsupported*Error` (no per-model field selection; the `s={...}` search parameter is JSON-shaped, not a plain term).
- **@nestjsx/crud `FilterOperatorEnum` mapping** (#44): `EQ`/`GT`/`GTE`/`LT`/`LTE`/`IN` map identically; `CONTAINS`→`$cont`, `ILIKE`→`$contL`, `SW`→`$starts`, `BTW`→`$between` (arity-checked, emits `min,max`), `NOT`→`$ne` (single) / `$notin` (multi), `NULL`→`$isnull`/`$notnull` (boolean dispatch, no value segment). PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` throw `UnsupportedFilterOperatorError`.
- **`NestjsxCrudResponseOptions`** (new class) (#44): pre-configured key mapping for the getMany envelope (`currentPage → 'page'`, `lastPage → 'pageCount'`, `perPage → 'count'`, `total → 'total'`); all paths overridable via `IPaginationConfig`.

- **Spring Data REST driver** (`DriverEnum.SPRING`) (#45): new driver targeting [Spring Data REST](https://spring.io/projects/spring-data-rest) — the standard pagination/sorting convention in the Java/Spring Boot ecosystem.
  - `SpringRequestStrategy`: repeatable `sort=field,asc` params (one occurrence per rule, lowercase direction), pagination as `page=N&size=N` with **0-indexed `page` on the wire** — library state stays 1-indexed and the strategy subtracts 1 at emission time.
  - `SpringResponseStrategy`: parses the HAL envelope — `page.{size,totalElements,totalPages,number}` (converting the 0-indexed `number` back to a 1-indexed page), navigation URLs from `_links.*.href`, and the data array from `_embedded`. The collection key under `_embedded` is the resource rel name and cannot be known statically, so the strategy picks the first array inside `_embedded` by default; pin an exact path via `IConfig.response` (`data: '_embedded.users'`). Missing `_embedded` (empty result set) yields an empty array.
  - First **sort-only** driver: `addSort`/`deleteSorts` and `setLimit`/`setPage` are supported; `addFilter`, `addFilterOperator`, `addSelect`, `addFields`, `addIncludes`, and `setSearch` all throw the matching `Unsupported*Error` (Spring Data REST defines no standard wire convention for these — they are custom query methods / Specifications server-side).
- **`SpringResponseOptions`** (new class) (#45): pre-configured dot-path mapping for the HAL envelope (`currentPage → 'page.number'`, `total → 'page.totalElements'`, `lastPage → 'page.totalPages'`, `perPage → 'page.size'`, `data → '_embedded'`, links → `_links.*.href`); all paths overridable via `IPaginationConfig`.

- **Sieve driver** (`DriverEnum.SIEVE`) (#46): new driver targeting [Sieve](https://github.com/Biarity/Sieve) for ASP.NET Core.
  - `SieveRequestStrategy`: single `filters=` parameter holding comma-joined (AND) `Field{op}Value` expression terms — simple single-value filters fold to `==`, multi-value filters fold to a value-level pipe OR (`status==active|pending`); `sorts=field,-other` CSV with `-` prefix for DESC; page-based pagination (`page=N&pageSize=N`).
  - `SieveResponseStrategy`: Sieve defines no response envelope (it returns an `IQueryable` the developer wraps), so the strategy ships sensible defaults for the common hand-rolled `PagedResult<T>` shape `{ data, page, pageSize, total, totalPages }`, with every key path configurable via `IConfig.response` (dot notation supported).
  - Sieve driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `setLimit`/`setPage` + their delete counterparts. `addFields`, `addIncludes`, `addSelect`, and `setSearch` throw the matching `Unsupported*Error` (Sieve has no projection, relation-loading, or global-search parameters; use `CONTAINS`/`ILIKE` operator filters for partial matches).
- **Sieve `FilterOperatorEnum` mapping** (#46): `EQ`→`==`, `GT`/`GTE`/`LT`/`LTE`→`>`/`>=`/`<`/`<=`, `CONTAINS`→`@=`, `ILIKE`→`@=*`, `SW`→`_=`, `IN`→`==` with value-level pipe OR, `BTW`→two AND-ed terms `field>=min,field<=max` (arity-checked), `NOT`→one `!=` term per value (AND-ed), `NULL`→`==null`/`!=null` (boolean dispatch). PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` throw `UnsupportedFilterOperatorError`.
- **`SieveResponseOptions`** (new class) (#46): pre-configured key mapping for the default `PagedResult<T>` shape (`currentPage → 'page'`, `perPage → 'pageSize'`, `lastPage → 'totalPages'`, `total → 'total'`); all paths overridable via `IPaginationConfig`.

### Changed
- **`package.json` `keywords`** expanded with `crud`, `nestjsx-crud` (#44), `hal`, `spring`, `spring-data-rest` (#45), and `aspnetcore`, `sieve` (#46) to surface the new drivers on npm. List remains alphabetised.

### Fixed
- **DRF strategies exported from the public API** (#72): `DrfRequestStrategy` and `DrfResponseStrategy` were missing from `public-api.ts` — every other driver's strategy pair was exported. Consumers can now import both directly from `ng-qubee`.

## [3.5.0] - 2026-05-15

### Added
- **Django REST Framework driver** (`DriverEnum.DRF`) (#47): new driver targeting [Django REST Framework](https://www.django-rest-framework.org/) with [django-filter](https://django-filter.readthedocs.io/).
  - `DrfRequestStrategy`: flat key=value filters with django-filter's double-underscore lookup convention (`field__gte=N`, `field__icontains=value`, `field__in=v1,v2,v3`), `ordering=-field1,field2` for sorts (`-` prefix = DESC), `search=term` (DRF's `SearchFilter`), page-based pagination (`page=N&page_size=M`). Multi-value simple filters collapse to `field__in=...`.
  - `DrfResponseStrategy`: parses the `{ count, next, previous, results }` envelope and **derives `currentPage` / `perPage` / `lastPage` by parsing the `next` and `previous` URLs** — DRF's `PageNumberPagination` doesn't echo the current page back in the body, so the strategy reads `?page=N` and `?page_size=N` from the link URLs. `previous=null` → page 1; `previous` without `?page` → page 2 (DRF omits `page=1`); `previous` with `?page=N` → page `N+1`.
  - DRF driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `setSearch`/`deleteSearch`, `setLimit`/`setPage` + their delete counterparts. `addFields`, `addIncludes`, and `addSelect` throw the matching `Unsupported*Error` (DRF has no first-class per-model fields, no relation includes, and no flat column-list select — `django-restql` adds these but is not core DRF).
- **DRF `FilterOperatorEnum` mapping** (#47): `EQ` emits no suffix (django-filter's default `exact`); `GT`/`GTE`/`LT`/`LTE`/`CONTAINS` map to identically-named lookups; `ILIKE`→`__icontains`, `SW`→`__startswith`, `IN`→`__in` (comma-joined), `BTW`→`__range=min,max` (arity-checked, requires exactly 2 values), `NULL`→`__isnull=true|false` (boolean dispatch). The generic `NOT` and PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` have no django-filter equivalent and throw `UnsupportedFilterOperatorError`.
- **`DrfResponseOptions`** (new public class) (#47): pre-configured key mapping for the DRF response envelope (`data → 'results'`, `total → 'count'`, `nextPageUrl → 'next'`, `prevPageUrl → 'previous'`). `currentPage`/`perPage`/`lastPage`/`from`/`to` default to empty paths because the strategy derives them from URL inspection rather than body fields; consumers can still override any path via `IPaginationConfig`.

### Changed
- **`package.json` `keywords`** expanded with `django` and `drf` to surface the new driver on npm. List remains alphabetised.

### Internal
- **`AbstractFlatResponseStrategy`** (#71) absorbs the byte-identical `paginate()` body that `LaravelResponseStrategy` and `SpatieResponseStrategy` were duplicating. Both response strategies collapse to one-line empty extensions, mirroring the pattern established by `AbstractDotPathResponseStrategy` for JSON:API / NestJS / Strapi in #67. Empty extensions are retained so the DI tokens resolve to distinct identities and future per-driver overrides have a place to land. Zero behavior change; existing specs unchanged.

## [3.4.0] - 2026-04-30

### Added
- **Strapi driver** (`DriverEnum.STRAPI`) (#51): new driver targeting [Strapi](https://strapi.io/) v4/v5 headless CMS.
  - `StrapiRequestStrategy`: deep-bracket filters (`filters[field][$eq]=value` single, `filters[field][$in][N]=value` multi-value), array-style sorts (`sort[N]=field:dir`), flat field selection (`fields[N]=col`), `populate[N]=relation` for related resources, page-based pagination (`pagination[page]=N&pagination[pageSize]=N`)
  - `StrapiResponseStrategy`: parses the `meta.pagination.{page,pageSize,pageCount,total}` envelope, computes `from`/`to` from page × pageSize × total
  - Strapi driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `addSelect`/`deleteSelect`, `addIncludes`/`deleteIncludes` (mapped to `populate`), `setLimit`/`setPage` + their delete counterparts. `addFields` and `setSearch` throw the matching `Unsupported*Error` (Strapi has no per-model fields and no global search; use `$contains`/`$containsi` operator filters for partial matches)
- **Strapi `FilterOperatorEnum` mapping** (#51): `EQ`/`GT`/`GTE`/`LT`/`LTE`/`CONTAINS`/`IN` map directly; `ILIKE`→`$containsi`, `SW`→`$startsWith`, `BTW`→`$between` (arity-checked, expands to a 2-element array), `NOT`→`$ne` (single) / `$notIn` (multi), `NULL`→`$null=true` / `$notNull=true` (boolean dispatch). PostgREST-only `FTS`/`PHFTS`/`PLFTS`/`WFTS` throw `UnsupportedFilterOperatorError`.
- **`StrapiResponseOptions`** (new public class) (#51): pre-configured dot-path mapping for the Strapi response envelope; consumers can override individual paths via `IPaginationConfig`.

### Changed
- **README condensed**: per-driver tutorials, the full Query Builder API reference, pagination guides, and TypeScript usage examples have moved to the documentation site at [ng-qubee.andreatantimonaco.me](https://ng-qubee.andreatantimonaco.me). The README now keeps a quick install + driver matrix + minimal example and points readers at the docs site for everything else.
- **`package.json` `homepage`** now points to [ng-qubee.andreatantimonaco.me](https://ng-qubee.andreatantimonaco.me) (was `github.com/.../#readme`).
- **`package.json` `keywords`** alphabetised and expanded with `headless-cms`, `json-api`, `laravel`, `nestjs`, `nestjs-paginate`, `spatie`, `strapi` to improve npm discoverability across the supported drivers.

## [3.3.0] - 2026-04-25

### Added
- **PostgREST / Supabase driver** (`DriverEnum.POSTGREST`) (#50): new driver targeting [PostgREST](https://postgrest.org/) and Supabase.
  - `PostgrestRequestStrategy`: operator-prefixed filters (`col=eq.val` single, `col=in.(v1,v2,v3)` multi-value), `order=col.asc,col.desc` sorting, flat `select=col1,col2`, offset-based pagination (`limit=N&offset=M` with offset derived from `page`)
  - `PostgrestResponseStrategy`: parses the total count from the HTTP `Content-Range` response header (opt-in via `Prefer: count=exact`), derives `page`/`perPage`/`lastPage`/`total` with 0-to-1-indexed conversion, tolerates missing/malformed headers gracefully
  - PostgREST driver supports `addFilter`/`deleteFilters`, `addFilterOperator`/`deleteOperatorFilters`, `addSort`/`deleteSorts`, `addSelect`/`deleteSelect`, `setLimit`/`setPage` + their delete counterparts. `addFields`, `addIncludes`, and `setSearch` throw the matching `Unsupported*Error` (embedded-resource support tracked as #66)
- **Full `FilterOperatorEnum` mapping on PostgREST** (#50): every existing operator (`EQ`, `GT`, `GTE`, `LT`, `LTE`, `ILIKE`, `IN`, `NOT`, `NULL`, `BTW`, `SW`, `CONTAINS`) is translated to PostgREST's prefix syntax, with correct semantics for the awkward ones:
  - `NOT` dispatches to `not.eq.val` (single) or `not.in.(v1,v2)` (multi) by arity
  - `NULL` maps a boolean value to `is.null` / `is.not.null`
  - `BTW` expands to **two** query params (`col=gte.min&col=lte.max`)
  - `SW` emits `like.val*`; `CONTAINS` emits `ilike.%val%`
- **PostgREST full-text search operators** (#50): four new `FilterOperatorEnum` entries — `FTS`, `PLFTS`, `PHFTS`, `WFTS` — map to PostgREST's `to_tsquery`, `plainto_tsquery`, `phraseto_tsquery`, and `websearch_to_tsquery` respectively. Column-scoped; use via `addFilterOperator(column, FilterOperatorEnum.FTS, term)`. Language modifiers (e.g. `fts(english)`) are not supported in this release.
- **`InvalidFilterOperatorValueError`** (new public error) (#50): thrown by the PostgREST strategy when an operator's value arity or type is unambiguously wrong at call time. `BTW` requires exactly 2 values; `NULL` requires exactly 1 boolean. Other operators leave validation to the server.
- **`PaginationModeEnum`** (new enum export) (#50): `QUERY` (default) or `RANGE`. Set via `IConfig.pagination`; currently honoured only by the PostgREST driver.
- **RANGE-header pagination on PostgREST** (#50): when `IConfig.pagination` is `PaginationModeEnum.RANGE`, `generateUri()` omits `limit`/`offset` from the URL and `NgQubeeService.paginationHeaders()` returns `{ 'Range-Unit': 'items', 'Range': 'from-to' }` for the consumer to merge into the HTTP request. Other drivers leave the setting as a no-op.
- **`NgQubeeService.paginationHeaders()`** (new method) (#50): thin passthrough to the active strategy's optional `buildPaginationHeaders`. Returns `null` for drivers that don't use header-based pagination.
- **`IRequestStrategy.buildPaginationHeaders?`** (new optional interface method) (#50): drivers that ship pagination metadata via HTTP headers implement it; all four pre-existing strategies omit it and the type is satisfied via TypeScript's structural typing without source changes.
- **`HeaderBag` type** (new export): union of `{ get(name): string | null }` (Angular `HttpHeaders`, native `Headers`) and `Record<string, string | null | undefined>` (plain object). Plus a `readHeader` helper that normalises access across both shapes.

### Changed
- **`PaginationService.paginate()` and `IResponseStrategy.paginate()` accept an optional trailing `headers?: HeaderBag` parameter** (#50). Backward-compatible: existing callers ignoring the new param keep working unchanged, and the four existing driver strategies (Laravel / Spatie / NestJS / JSON:API) satisfy the extended interface via TypeScript's structural typing without any source changes. PostgREST uses it to read `Content-Range`; body-only drivers ignore it.

### Documentation
- **Documentation site launched** (#68) at [https://ng-qubee.andreatantimonaco.me](https://ng-qubee.andreatantimonaco.me). Built with Docusaurus 3, hosted on GitHub Pages with first-class versioning (3.3.0 ships as the initial snapshot; `next` tracks `develop`). Includes:
  - Curated guides — Getting Started, one page per driver (JSON:API / Laravel / Spatie / NestJS / PostgREST), Fetching data (with reactive `UserClient` example), Query Builder API, Pagination, Per-component instances
  - Auto-generated API reference via `docusaurus-plugin-typedoc`, scoped to `src/public-api.ts` so it covers exactly what consumers can import
  - GitHub Actions deployment workflow (`.github/workflows/docs.yml`) — production builds on every push to `master`, path-filtered to skip irrelevant commits

### Internal
- **Driver architecture refactor** (#67) — pure internal cleanup, zero public-API change. Adding the next driver is now ~1 strategy file + 1 entry in the registry + 1 entry in `DriverEnum`; nothing else needs to be touched.
  - **Capability declarations replace driver allowlists.** New `IStrategyCapabilities` interface and `capabilities` getter on `IRequestStrategy`; each strategy declares its supported features in one object literal. `NgQubeeService._assertDriver([...], err)` becomes `_assertCapability(flag, err)` — the service no longer reads `DriverEnum` for feature gating.
  - **`AbstractRequestStrategy`** owns the `assertResource` guard, the `?`/`&` URL composition (`baseUri` + `join`), and the default positive-integer `validateLimit`. Concrete strategies migrate from a mutable `this._uri` accumulator to a `protected parts(state, options): string[]` template method, eliminating the copy-pasted `_prepend(state)` helper from all five drivers and the latent re-entrancy footgun.
  - **`AbstractDotPathResponseStrategy`** absorbs the byte-identical `_resolve` / `_resolveFrom` / `_resolveTo` traversal that JSON:API and NestJS were duplicating; both response strategies collapse to one-line empty extensions (kept for distinct DI identity).
  - **Driver registry** (`src/lib/drivers/driver-registry.ts`) replaces the three parallel `switch(driver)` blocks in `provide-ngqubee.ts`. `Record<DriverEnum, IDriverDefinition>` gives compile-time exhaustiveness — adding a new `DriverEnum` value fails to compile until its definition lands in the registry.

## [3.2.0] - 2026-04-21

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

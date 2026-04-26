import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';

import { DriverEnum } from '../enums/driver.enum';
import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { UnsupportedFieldSelectionError } from '../errors/unsupported-field-selection.error';
import { UnsupportedFilterError } from '../errors/unsupported-filter.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { UnsupportedIncludesError } from '../errors/unsupported-includes.error';
import { UnsupportedSearchError } from '../errors/unsupported-search.error';
import { UnsupportedSelectError } from '../errors/unsupported-select.error';
import { UnsupportedSortError } from '../errors/unsupported-sort.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { InvalidPageNumberError } from '../errors/invalid-page-number.error';
import { PaginationNotSyncedError } from '../errors/pagination-not-synced.error';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { LaravelRequestStrategy } from '../strategies/laravel-request.strategy';
import { NestjsRequestStrategy } from '../strategies/nestjs-request.strategy';
import { PaginationModeEnum } from '../enums/pagination-mode.enum';
import { PostgrestRequestStrategy } from '../strategies/postgrest-request.strategy';
import { SpatieRequestStrategy } from '../strategies/spatie-request.strategy';
import { NestService } from './nest.service';
import { NgQubeeService } from './ng-qubee.service';

describe('NgQubeeService standard config', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new SpatieRequestStrategy(), DriverEnum.SPATIE)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a URI', (done: DoneFn) => {
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('/users');
      done();
    });
  });

  it('should generate a URI with a custom limit', (done: DoneFn) => {
    service.setResource('users');
    service.setLimit(25);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('limit=25');
      done();
    });
  });

  it('should generate a URI with a default limit', (done: DoneFn) => {
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('limit=15');
      done();
    });
  });

  it('should generate a URI with a custom page', (done: DoneFn) => {
    service.setResource('users');
    service.setPage(5);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('page=5');
      done();
    });
  });

  it('should generate a URI with a default page', (done: DoneFn) => {
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('page=1');
      done();
    });
  });

  it('should generate a URI with fields (single model)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fields[users]=email,name');
      done();
    });
  });

  it('should ignore empty fields (single model)', (done: DoneFn) => {
    service.addFields('users', []);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).not.toContain('fields[users]=');
      done();
    });
  });

  it('should generate a URI with included models', (done: DoneFn) => {
    service.addIncludes('model1', 'model2');
    service.addIncludes('model3');
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toBe('/users?include=model1,model2,model3&limit=15&page=1');
      done();
    });
  });

  it('should generate a URI with fields (multiple models)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.addFields('settings', ['field1', 'field2']);
    service.addIncludes('settings');
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fields[users]=email,name');
      expect(uri).toContain('fields[settings]=field1,field2');
      done();
    });
  });

  it('should generate a URI with filter (multiple values)', (done: DoneFn) => {
    service.addFilter('id', 1, 2, 3);
    service.addFilter('name', 'doe');
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[id]=1,2,3');
      expect(uri).toContain('filter[name]=doe');
      done();
    });
  });

  it('should generate a URI with filter (mixed values)', (done: DoneFn) => {
    service.addFilter('field', 1, '2', 3);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[field]=1,2,3');
      done();
    });
  });

  it('should ignore empty filters', (done: DoneFn) => {
    service.addFilter('field');
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).not.toContain('filter[field]=');
      done();
    });
  });

  it('should generate a URI with filter (boolean value)', (done: DoneFn) => {
    service.addFilter('isActive', true);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[isActive]=true');
      done();
    });
  });

  it('should generate a URI with sorted field ASC', (done: DoneFn) => {
    service.addSort('f', SortEnum.ASC);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=f');
      done();
    });
  });

  it('should generate a URI with sorted fields mixed ASC and DESC', (done: DoneFn) => {
    service.addSort('f1', SortEnum.DESC);
    service.addSort('f2', SortEnum.ASC);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=-f1,f2');
      done();
    });
  });

  it('should generate a URI with sorted field DESC', (done: DoneFn) => {
    service.addSort('f', SortEnum.DESC);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=-f');
      done();
    });
  });

  it('should reset the internal state', (done: DoneFn) => {
    service.setResource('users');
    service.addFields('settings', ['a']);
    service.reset();
    service.setResource('settings');

    service.generateUri().subscribe(uri => {
      expect(uri).toBe('/settings?limit=15&page=1');
      done();
    });
  });

  it('should generate a URL if a base url is given', (done: DoneFn) => {
    service.setResource('users');
    service.setBaseUrl('https://domain.com');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('https://domain.com/users');
      done();
    });
  });

  it('should throw an error if the model requested as field is not the model property / included in the includes object', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.addFields('settings', ['field1', 'field2']);
    service.setResource('users');

    service.generateUri().subscribe({
      next: () => {
        fail('Expected an error to be thrown');
        done();
      },
      error: (err) => {
        expect(err.message).toEqual(new UnselectableModelError('settings').message);
        done();
      }
    });
  });
});

describe('NgQubeeService custom config', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new SpatieRequestStrategy(), DriverEnum.SPATIE, new QueryBuilderOptions({
              appends: 'app',
              fields: 'fld',
              filters: 'flt',
              includes: 'inc',
              limit: 'lmt',
              page: 'p',
              sort: 'srt'
            }))
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should generate a URI with fields (single model)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fld[users]=email,name');
      done();
    });
  });

  it('should generate a URI with filter', (done: DoneFn) => {
    service.addFilter('id', 1, 2, 3);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('flt[id]=1,2,3');
      done();
    });
  });

  it('should generate a URI with included models', (done: DoneFn) => {
    service.addIncludes('model1', 'model2');
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('inc=model1,model2');
      done();
    });
  });

  it('should generate a URI with a custom limit', (done: DoneFn) => {
    service.setResource('users');
    service.setLimit(25);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('lmt=25');
      done();
    });
  });

  it('should generate a URI with a custom page', (done: DoneFn) => {
    service.setResource('users');
    service.setPage(5);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('p=5');
      done();
    });
  });

  it('should generate a URI with sorted field ASC', (done: DoneFn) => {
    service.addSort('f', SortEnum.ASC);
    service.setResource('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('srt=f');
      done();
    });
  });
});

describe('NgQubeeService driver validation (Spatie)', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new SpatieRequestStrategy(), DriverEnum.SPATIE)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should throw UnsupportedFilterOperatorError when calling addFilterOperator', () => {
    expect(() => service.addFilterOperator('field', FilterOperatorEnum.EQ, 'value'))
      .toThrowError(UnsupportedFilterOperatorError);
  });

  it('should throw UnsupportedSelectError when calling addSelect', () => {
    expect(() => service.addSelect('col1', 'col2'))
      .toThrowError(UnsupportedSelectError);
  });

  it('should throw UnsupportedSearchError when calling setSearch', () => {
    expect(() => service.setSearch('term'))
      .toThrowError(UnsupportedSearchError);
  });

  it('should throw UnsupportedSearchError when calling deleteSearch', () => {
    expect(() => service.deleteSearch())
      .toThrowError(UnsupportedSearchError);
  });

  it('should throw UnsupportedSelectError when calling deleteSelect', () => {
    expect(() => service.deleteSelect('col1'))
      .toThrowError(UnsupportedSelectError);
  });

  it('should throw UnsupportedFilterOperatorError when calling deleteOperatorFilters', () => {
    expect(() => service.deleteOperatorFilters('field'))
      .toThrowError(UnsupportedFilterOperatorError);
  });

  it('should delegate setLimit validation to the active strategy (rejects -1 for Spatie)', () => {
    expect(() => service.setLimit(-1)).toThrowError(InvalidLimitError);
  });
});

describe('NgQubeeService driver validation (Laravel)', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new LaravelRequestStrategy(), DriverEnum.LARAVEL)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should throw UnsupportedFilterError when calling addFilter', () => {
    expect(() => service.addFilter('field', 'value'))
      .toThrowError(UnsupportedFilterError);
  });

  it('should throw UnsupportedSortError when calling addSort', () => {
    expect(() => service.addSort('field', SortEnum.ASC))
      .toThrowError(UnsupportedSortError);
  });

  it('should throw UnsupportedFieldSelectionError when calling addFields', () => {
    expect(() => service.addFields('users', ['id']))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedIncludesError when calling addIncludes', () => {
    expect(() => service.addIncludes('model1'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should throw UnsupportedFilterOperatorError when calling addFilterOperator', () => {
    expect(() => service.addFilterOperator('field', FilterOperatorEnum.EQ, 'value'))
      .toThrowError(UnsupportedFilterOperatorError);
  });

  it('should throw UnsupportedSelectError when calling addSelect', () => {
    expect(() => service.addSelect('col1', 'col2'))
      .toThrowError(UnsupportedSelectError);
  });

  it('should throw UnsupportedSearchError when calling setSearch', () => {
    expect(() => service.setSearch('term'))
      .toThrowError(UnsupportedSearchError);
  });

  it('should throw UnsupportedFilterError when calling deleteFilters with args', () => {
    expect(() => service.deleteFilters('field'))
      .toThrowError(UnsupportedFilterError);
  });

  it('should throw UnsupportedSortError when calling deleteSorts with args', () => {
    expect(() => service.deleteSorts('field'))
      .toThrowError(UnsupportedSortError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFields', () => {
    expect(() => service.deleteFields({ users: ['id'] }))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFieldsByModel', () => {
    expect(() => service.deleteFieldsByModel('users', 'id'))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedIncludesError when calling deleteIncludes', () => {
    expect(() => service.deleteIncludes('model1'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should throw UnsupportedFilterOperatorError when calling deleteOperatorFilters', () => {
    expect(() => service.deleteOperatorFilters('field'))
      .toThrowError(UnsupportedFilterOperatorError);
  });

  it('should throw UnsupportedSelectError when calling deleteSelect', () => {
    expect(() => service.deleteSelect('col1'))
      .toThrowError(UnsupportedSelectError);
  });

  it('should throw UnsupportedSearchError when calling deleteSearch', () => {
    expect(() => service.deleteSearch())
      .toThrowError(UnsupportedSearchError);
  });

  it('should not throw when calling setResource', () => {
    expect(() => service.setResource('users')).not.toThrow();
  });

  it('should not throw when calling setBaseUrl', () => {
    expect(() => service.setBaseUrl('https://api.example.com')).not.toThrow();
  });

  it('should not throw when calling setLimit', () => {
    expect(() => service.setLimit(10)).not.toThrow();
  });

  it('should not throw when calling setPage', () => {
    expect(() => service.setPage(1)).not.toThrow();
  });

  it('should not throw when calling reset', () => {
    expect(() => service.reset()).not.toThrow();
  });

  it('should not throw when calling generateUri', (done: DoneFn) => {
    service.setResource('users');
    service.generateUri().subscribe(uri => {
      expect(uri).toContain('/users');
      done();
    });
  });
});

describe('NgQubeeService driver validation (NestJS)', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new NestjsRequestStrategy(), DriverEnum.NESTJS)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should throw UnsupportedFieldSelectionError when calling addFields', () => {
    expect(() => service.addFields('users', ['id']))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedIncludesError when calling addIncludes', () => {
    expect(() => service.addIncludes('model1'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFields', () => {
    expect(() => service.deleteFields({ users: ['id'] }))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFieldsByModel', () => {
    expect(() => service.deleteFieldsByModel('users', 'id'))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedIncludesError when calling deleteIncludes', () => {
    expect(() => service.deleteIncludes('model1'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should not throw when calling addFilter', () => {
    expect(() => service.addFilter('status', 'active')).not.toThrow();
  });

  it('should not throw when calling addSort', () => {
    expect(() => service.addSort('name', SortEnum.ASC)).not.toThrow();
  });

  it('should not throw when calling deleteFilters', () => {
    service.addFilter('status', 'active');
    expect(() => service.deleteFilters('status')).not.toThrow();
  });

  it('should not throw when calling deleteSorts', () => {
    service.addSort('name', SortEnum.ASC);
    expect(() => service.deleteSorts('name')).not.toThrow();
  });

  it('should allow NestJS-specific methods', () => {
    expect(() => service.addFilterOperator('age', FilterOperatorEnum.GTE, 18)).not.toThrow();
    expect(() => service.addSelect('col1', 'col2')).not.toThrow();
    expect(() => service.setSearch('test')).not.toThrow();
    expect(() => service.deleteSearch()).not.toThrow();
    expect(() => service.deleteSelect('col1')).not.toThrow();
    expect(() => service.deleteOperatorFilters('age')).not.toThrow();
  });

  it('should generate a URI with NestJS format', (done: DoneFn) => {
    service.setResource('users');
    service.addFilter('status', 'active');
    service.addSort('name', SortEnum.ASC);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('/users?');
      expect(uri).toContain('filter.status=active');
      expect(uri).toContain('sortBy=name:ASC');
      expect(uri).toContain('limit=15');
      expect(uri).toContain('page=1');
      done();
    });
  });

  it('should generate a URI with operator filters', (done: DoneFn) => {
    service.setResource('users');
    service.addFilterOperator('age', FilterOperatorEnum.GTE, 18);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter.age=$gte:18');
      done();
    });
  });

  it('should generate a URI with select', (done: DoneFn) => {
    service.setResource('users');
    service.addSelect('id', 'name', 'email');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('select=id,name,email');
      done();
    });
  });

  it('should generate a URI with search', (done: DoneFn) => {
    service.setResource('users');
    service.setSearch('john');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('search=john');
      done();
    });
  });

  it('should accept setLimit(-1) (fetch all) and propagate to the generated URI', (done: DoneFn) => {
    service.setResource('users');
    expect(() => service.setLimit(-1)).not.toThrow();

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('limit=-1');
      done();
    });
  });
});

describe('NgQubeeService pagination navigation helpers', () => {
  let service: NgQubeeService;
  let nestService: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nest: NestService) =>
            new NgQubeeService(nest, new NestjsRequestStrategy(), DriverEnum.NESTJS)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
    nestService = TestBed.inject(NestService);
  });

  describe('currentPage', () => {
    it('should return state.page', () => {
      expect(service.currentPage()).toBe(1);
      service.setPage(7);
      expect(service.currentPage()).toBe(7);
    });
  });

  describe('firstPage', () => {
    it('should set page to 1', () => {
      service.setPage(5);
      service.firstPage();
      expect(service.currentPage()).toBe(1);
    });

    it('should be idempotent when already on page 1', () => {
      service.firstPage();
      expect(service.currentPage()).toBe(1);
    });

    it('should return this for chaining', () => {
      expect(service.firstPage()).toBe(service);
    });
  });

  describe('nextPage', () => {
    it('should increment page by 1 when bounds are unknown', () => {
      service.setPage(3);
      service.nextPage();
      expect(service.currentPage()).toBe(4);
    });

    it('should no-op when already at lastPage (bounds known)', () => {
      nestService.syncLastPage(5);
      service.setPage(5);
      service.nextPage();
      expect(service.currentPage()).toBe(5);
    });

    it('should increment when below lastPage (bounds known)', () => {
      nestService.syncLastPage(5);
      service.setPage(3);
      service.nextPage();
      expect(service.currentPage()).toBe(4);
    });

    it('should return this for chaining', () => {
      expect(service.nextPage()).toBe(service);
    });
  });

  describe('previousPage', () => {
    it('should decrement page by 1', () => {
      service.setPage(4);
      service.previousPage();
      expect(service.currentPage()).toBe(3);
    });

    it('should be floored at 1 (idempotent on page 1)', () => {
      service.previousPage();
      expect(service.currentPage()).toBe(1);
    });

    it('should return this for chaining', () => {
      expect(service.previousPage()).toBe(service);
    });
  });

  describe('lastPage', () => {
    it('should throw PaginationNotSyncedError before any paginate()', () => {
      expect(() => service.lastPage()).toThrowError(PaginationNotSyncedError);
    });

    it('should set page to state.lastPage after sync', () => {
      nestService.syncLastPage(8);
      service.lastPage();
      expect(service.currentPage()).toBe(8);
    });

    it('should return this for chaining after sync', () => {
      nestService.syncLastPage(3);
      expect(service.lastPage()).toBe(service);
    });
  });

  describe('goToPage', () => {
    it('should set page to n', () => {
      service.goToPage(4);
      expect(service.currentPage()).toBe(4);
    });

    it('should throw InvalidPageNumberError for 0', () => {
      expect(() => service.goToPage(0)).toThrowError(InvalidPageNumberError);
    });

    it('should throw InvalidPageNumberError for a negative page', () => {
      expect(() => service.goToPage(-3)).toThrowError(InvalidPageNumberError);
    });

    it('should throw InvalidPageNumberError for a non-integer', () => {
      expect(() => service.goToPage(2.5)).toThrowError(InvalidPageNumberError);
    });

    it('should throw InvalidPageNumberError when n > lastPage and bounds known', () => {
      nestService.syncLastPage(5);
      expect(() => service.goToPage(10)).toThrowError(InvalidPageNumberError);
    });

    it('should allow n === lastPage when bounds known', () => {
      nestService.syncLastPage(5);
      service.goToPage(5);
      expect(service.currentPage()).toBe(5);
    });

    it('should allow any positive n when bounds unknown', () => {
      service.goToPage(999);
      expect(service.currentPage()).toBe(999);
    });

    it('should return this for chaining', () => {
      expect(service.goToPage(2)).toBe(service);
    });
  });

  describe('isFirstPage', () => {
    it('should return true on page 1', () => {
      expect(service.isFirstPage()).toBe(true);
    });

    it('should return false on other pages', () => {
      service.setPage(3);
      expect(service.isFirstPage()).toBe(false);
    });
  });

  describe('isLastPage', () => {
    it('should return false when bounds unknown (conservative default)', () => {
      expect(service.isLastPage()).toBe(false);
      service.setPage(99);
      expect(service.isLastPage()).toBe(false);
    });

    it('should return true when page === lastPage (bounds known)', () => {
      nestService.syncLastPage(5);
      service.setPage(5);
      expect(service.isLastPage()).toBe(true);
    });

    it('should return false when page < lastPage (bounds known)', () => {
      nestService.syncLastPage(5);
      service.setPage(3);
      expect(service.isLastPage()).toBe(false);
    });
  });

  describe('hasNextPage', () => {
    it('should return true when bounds unknown (conservative default)', () => {
      expect(service.hasNextPage()).toBe(true);
    });

    it('should return true when page < lastPage', () => {
      nestService.syncLastPage(5);
      service.setPage(3);
      expect(service.hasNextPage()).toBe(true);
    });

    it('should return false when page === lastPage', () => {
      nestService.syncLastPage(5);
      service.setPage(5);
      expect(service.hasNextPage()).toBe(false);
    });
  });

  describe('hasPreviousPage', () => {
    it('should return false on page 1', () => {
      expect(service.hasPreviousPage()).toBe(false);
    });

    it('should return true on any page > 1', () => {
      service.setPage(2);
      expect(service.hasPreviousPage()).toBe(true);
    });
  });

  describe('totalPages', () => {
    it('should throw PaginationNotSyncedError before any paginate()', () => {
      expect(() => service.totalPages()).toThrowError(PaginationNotSyncedError);
    });

    it('should return state.lastPage after sync', () => {
      nestService.syncLastPage(12);
      expect(service.totalPages()).toBe(12);
    });
  });
});

describe('NgQubeeService auto-reset page on result-set-changing mutations', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nest: NestService) =>
            new NgQubeeService(nest, new NestjsRequestStrategy(), DriverEnum.NESTJS)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
    service.setResource('users');
    service.setPage(5);
  });

  it('setLimit should reset page to 1', () => {
    service.setLimit(25);
    expect(service.currentPage()).toBe(1);
  });

  it('setResource should reset page to 1', () => {
    service.setResource('posts');
    expect(service.currentPage()).toBe(1);
  });

  it('setSearch should reset page to 1', () => {
    service.setSearch('term');
    expect(service.currentPage()).toBe(1);
  });

  it('deleteSearch should reset page to 1', () => {
    service.setSearch('term');
    service.setPage(5);
    service.deleteSearch();
    expect(service.currentPage()).toBe(1);
  });

  it('addFilter should reset page to 1', () => {
    service.addFilter('status', 'active');
    expect(service.currentPage()).toBe(1);
  });

  it('deleteFilters should reset page to 1', () => {
    service.addFilter('status', 'active');
    service.setPage(5);
    service.deleteFilters('status');
    expect(service.currentPage()).toBe(1);
  });

  it('addFilterOperator should reset page to 1', () => {
    service.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
    expect(service.currentPage()).toBe(1);
  });

  it('deleteOperatorFilters should reset page to 1', () => {
    service.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
    service.setPage(5);
    service.deleteOperatorFilters('age');
    expect(service.currentPage()).toBe(1);
  });

  it('addSort should reset page to 1', () => {
    service.addSort('name', SortEnum.ASC);
    expect(service.currentPage()).toBe(1);
  });

  it('deleteSorts should reset page to 1', () => {
    service.addSort('name', SortEnum.ASC);
    service.setPage(5);
    service.deleteSorts('name');
    expect(service.currentPage()).toBe(1);
  });

  it('setBaseUrl should NOT reset page', () => {
    service.setBaseUrl('https://api.example.com');
    expect(service.currentPage()).toBe(5);
  });

  it('addSelect should NOT reset page', () => {
    service.addSelect('id', 'name');
    expect(service.currentPage()).toBe(5);
  });

  it('deleteSelect should NOT reset page', () => {
    service.addSelect('id', 'name');
    service.setPage(5);
    service.deleteSelect('id');
    expect(service.currentPage()).toBe(5);
  });
});

describe('NgQubeeService auto-reset page — Spatie-only mutations', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nest: NestService) =>
            new NgQubeeService(nest, new SpatieRequestStrategy(), DriverEnum.SPATIE)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
    service.setResource('users');
    service.setPage(5);
  });

  it('addFields should NOT reset page', () => {
    service.addFields('users', ['id', 'email']);
    expect(service.currentPage()).toBe(5);
  });

  it('deleteFields should NOT reset page', () => {
    service.addFields('users', ['id', 'email']);
    service.setPage(5);
    service.deleteFields({ users: ['id'] });
    expect(service.currentPage()).toBe(5);
  });

  it('deleteFieldsByModel should NOT reset page', () => {
    service.addFields('users', ['id', 'email']);
    service.setPage(5);
    service.deleteFieldsByModel('users', 'id');
    expect(service.currentPage()).toBe(5);
  });

  it('addIncludes should NOT reset page', () => {
    service.addIncludes('profile');
    expect(service.currentPage()).toBe(5);
  });

  it('deleteIncludes should NOT reset page', () => {
    service.addIncludes('profile');
    service.setPage(5);
    service.deleteIncludes('profile');
    expect(service.currentPage()).toBe(5);
  });
});

describe('NgQubeeService driver validation (PostgREST)', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, new PostgrestRequestStrategy(), DriverEnum.POSTGREST)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  // Supported: filters, sorts, flat select, pagination
  it('should accept addFilter', () => {
    expect(() => service.addFilter('status', 'active')).not.toThrow();
  });

  it('should accept deleteFilters', () => {
    service.addFilter('status', 'active');
    expect(() => service.deleteFilters('status')).not.toThrow();
  });

  it('should accept addSort', () => {
    expect(() => service.addSort('name', SortEnum.ASC)).not.toThrow();
  });

  it('should accept deleteSorts', () => {
    service.addSort('name', SortEnum.ASC);
    expect(() => service.deleteSorts('name')).not.toThrow();
  });

  it('should accept addSelect', () => {
    expect(() => service.addSelect('id', 'email')).not.toThrow();
  });

  it('should accept deleteSelect', () => {
    service.addSelect('id', 'email');
    expect(() => service.deleteSelect('id')).not.toThrow();
  });

  // Unsupported: fields, includes, operator filters, search
  it('should throw UnsupportedFieldSelectionError when calling addFields', () => {
    expect(() => service.addFields('users', ['id']))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFields', () => {
    expect(() => service.deleteFields({ users: ['id'] }))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedFieldSelectionError when calling deleteFieldsByModel', () => {
    expect(() => service.deleteFieldsByModel('users', 'id'))
      .toThrowError(UnsupportedFieldSelectionError);
  });

  it('should throw UnsupportedIncludesError when calling addIncludes', () => {
    expect(() => service.addIncludes('profile'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should throw UnsupportedIncludesError when calling deleteIncludes', () => {
    expect(() => service.deleteIncludes('profile'))
      .toThrowError(UnsupportedIncludesError);
  });

  it('should accept addFilterOperator', () => {
    expect(() => service.addFilterOperator('age', FilterOperatorEnum.GTE, 18)).not.toThrow();
  });

  it('should accept deleteOperatorFilters', () => {
    service.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
    expect(() => service.deleteOperatorFilters('age')).not.toThrow();
  });

  it('should throw UnsupportedSearchError when calling setSearch', () => {
    expect(() => service.setSearch('term'))
      .toThrowError(UnsupportedSearchError);
  });

  it('should throw UnsupportedSearchError when calling deleteSearch', () => {
    expect(() => service.deleteSearch())
      .toThrowError(UnsupportedSearchError);
  });

  // URI generation end-to-end
  it('should generate a URI with PostgREST format', (done: DoneFn) => {
    service.setResource('users');
    service.addFilter('status', 'active');
    service.addSort('created_at', SortEnum.DESC);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('/users?');
      expect(uri).toContain('status=eq.active');
      expect(uri).toContain('order=created_at.desc');
      expect(uri).toContain('limit=15');
      done();
    });
  });

  it('should return null from paginationHeaders in QUERY mode (default)', () => {
    expect(service.paginationHeaders()).toBeNull();
  });
});

describe('NgQubeeService paginationHeaders (PostgREST, RANGE mode)', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nest: NestService) =>
            new NgQubeeService(nest, new PostgrestRequestStrategy(PaginationModeEnum.RANGE), DriverEnum.POSTGREST)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should return Range-Unit and Range headers', () => {
    service.setLimit(10);
    service.setPage(3);

    expect(service.paginationHeaders()).toEqual({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Range-Unit': 'items',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Range': '20-29'
    });
  });

  it('should omit limit/offset from the generated URI in RANGE mode', (done: DoneFn) => {
    service.setResource('users');
    service.setLimit(10);
    service.setPage(2);

    service.generateUri().subscribe(uri => {
      expect(uri).not.toContain('limit=');
      expect(uri).not.toContain('offset=');
      done();
    });
  });
});

describe('NgQubeeService paginationHeaders (other drivers return null)', () => {
  it('should return null for the Spatie driver', () => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nest: NestService) =>
            new NgQubeeService(nest, new SpatieRequestStrategy(), DriverEnum.SPATIE)
        }, NestService
      ]
    });

    const service = TestBed.inject(NgQubeeService);

    expect(service.paginationHeaders()).toBeNull();
  });
});

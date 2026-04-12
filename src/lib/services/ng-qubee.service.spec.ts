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
import { LaravelRequestStrategy } from '../strategies/laravel-request.strategy';
import { NestjsRequestStrategy } from '../strategies/nestjs-request.strategy';
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
            new NgQubeeService(nestService, new SpatieRequestStrategy(), DriverEnum.SPATIE, {
              appends: 'app',
              fields: 'fld',
              filters: 'flt',
              includes: 'inc',
              limit: 'lmt',
              page: 'p',
              sort: 'srt'
            })
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
});

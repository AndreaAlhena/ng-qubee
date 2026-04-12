import { TestBed } from '@angular/core/testing';

import { LaravelResponseStrategy } from '../strategies/laravel-response.strategy';
import { NestjsResponseStrategy } from '../strategies/nestjs-response.strategy';
import { SpatieResponseStrategy } from '../strategies/spatie-response.strategy';
import { NestjsResponseOptions } from '../models/response-options';
import { PaginationService } from './pagination.service';

describe('PaginationService (Spatie)', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(new SpatieResponseStrategy())
      }]
    });
    service = TestBed.inject(PaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should paginate with minimum required data (data and current_page fields)', () => {
    const collection = service.paginate({
      data: [],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_page: 1
    });

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should paginate', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const collection = service.paginate({
      data: [{}],
      current_page: 1,
      first_page_url: 'http://domain.com?page=1',
      from: 1,
      last_page: 2,
      last_page_url: 'http://domain.com?page=2',
      next_page_url: 'http://domain.com?page=2',
      path: 'http://domain.com',
      per_page: 15,
      prev_page_url: null,
      to: 15,
      total: 30
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    expect(collection.data).toHaveSize(1);
    expect(collection.page).toBe(1);
    expect(collection.firstPageUrl).toBe('http://domain.com?page=1');
    expect(collection.from).toBe(1);
    expect(collection.lastPage).toBe(2);
    expect(collection.lastPageUrl).toBe('http://domain.com?page=2');
    expect(collection.nextPageUrl).toBe('http://domain.com?page=2');
    expect(collection.perPage).toBe(15);
    expect(collection.prevPageUrl).toBeFalsy();
    expect(collection.to).toBe(15);
    expect(collection.total).toBe(30);
    expect(collection.page).toBe(1);
  });
});

describe('PaginationService (Laravel)', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(new LaravelResponseStrategy())
      }]
    });
    service = TestBed.inject(PaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should paginate with minimum required data (data and current_page fields)', () => {
    const collection = service.paginate({
      data: [],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      current_page: 1
    });

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should paginate', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const collection = service.paginate({
      data: [{}],
      current_page: 1,
      first_page_url: 'http://domain.com?page=1',
      from: 1,
      last_page: 2,
      last_page_url: 'http://domain.com?page=2',
      next_page_url: 'http://domain.com?page=2',
      path: 'http://domain.com',
      per_page: 15,
      prev_page_url: null,
      to: 15,
      total: 30
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    expect(collection.data).toHaveSize(1);
    expect(collection.page).toBe(1);
    expect(collection.firstPageUrl).toBe('http://domain.com?page=1');
    expect(collection.from).toBe(1);
    expect(collection.lastPage).toBe(2);
    expect(collection.lastPageUrl).toBe('http://domain.com?page=2');
    expect(collection.nextPageUrl).toBe('http://domain.com?page=2');
    expect(collection.perPage).toBe(15);
    expect(collection.prevPageUrl).toBeFalsy();
    expect(collection.to).toBe(15);
    expect(collection.total).toBe(30);
    expect(collection.page).toBe(1);
  });
});

describe('PaginationService (NestJS)', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: PaginationService,
        useFactory: () =>
          new PaginationService(
            new NestjsResponseStrategy(),
            new NestjsResponseOptions({})
          )
      }]
    });
    service = TestBed.inject(PaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should paginate a NestJS response with minimum required data', () => {
    const collection = service.paginate({
      data: [],
      meta: { currentPage: 1 }
    });

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should paginate a full NestJS response', () => {
    const collection = service.paginate({
      data: [{ id: 1, name: 'Test' }],
      meta: {
        currentPage: 2,
        totalItems: 50,
        itemsPerPage: 10,
        totalPages: 5
      },
      links: {
        first: 'http://api.com/users?page=1',
        previous: 'http://api.com/users?page=1',
        next: 'http://api.com/users?page=3',
        last: 'http://api.com/users?page=5',
        current: 'http://api.com/users?page=2'
      }
    });

    expect(collection.data).toHaveSize(1);
    expect(collection.page).toBe(2);
    expect(collection.total).toBe(50);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.firstPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.prevPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.nextPageUrl).toBe('http://api.com/users?page=3');
    expect(collection.lastPageUrl).toBe('http://api.com/users?page=5');
  });

  it('should compute from and to values when not present in response', () => {
    const collection = service.paginate({
      data: [{ id: 1 }],
      meta: {
        currentPage: 3,
        totalItems: 100,
        itemsPerPage: 10,
        totalPages: 10
      },
      links: {}
    });

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('should handle last page where to does not exceed total', () => {
    const collection = service.paginate({
      data: [{ id: 1 }],
      meta: {
        currentPage: 4,
        totalItems: 35,
        itemsPerPage: 10,
        totalPages: 4
      },
      links: {}
    });

    expect(collection.from).toBe(31);
    expect(collection.to).toBe(35);
  });

  it('should handle response with null link values', () => {
    const collection = service.paginate({
      data: [],
      meta: {
        currentPage: 1,
        totalItems: 5,
        itemsPerPage: 10,
        totalPages: 1
      },
      links: {
        first: 'http://api.com/users?page=1',
        previous: null,
        next: null,
        last: 'http://api.com/users?page=1'
      }
    });

    expect(collection.prevPageUrl).toBeNull();
    expect(collection.nextPageUrl).toBeNull();
    expect(collection.firstPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.lastPageUrl).toBe('http://api.com/users?page=1');
  });
});

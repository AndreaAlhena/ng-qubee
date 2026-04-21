import { TestBed } from '@angular/core/testing';

import { JsonApiResponseStrategy } from '../strategies/json-api-response.strategy';
import { LaravelResponseStrategy } from '../strategies/laravel-response.strategy';
import { NestjsResponseStrategy } from '../strategies/nestjs-response.strategy';
import { SpatieResponseStrategy } from '../strategies/spatie-response.strategy';
import { JsonApiResponseOptions, NestjsResponseOptions } from '../models/response-options';
import { NestService } from './nest.service';
import { PaginationService } from './pagination.service';

describe('PaginationService (Spatie)', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nestService: NestService) =>
            new PaginationService(nestService, new SpatieResponseStrategy())
        }
      ]
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
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nestService: NestService) =>
            new PaginationService(nestService, new LaravelResponseStrategy())
        }
      ]
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
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nestService: NestService) =>
            new PaginationService(
              nestService,
              new NestjsResponseStrategy(),
              new NestjsResponseOptions({})
            )
        }
      ]
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

// Auto-sync contract: paginate() writes state.page and flips isLastPageKnown
// when the response carries a positive lastPage. Exercised across all four
// driver response strategies so the behavior is portable.
describe('PaginationService auto-sync (Spatie)', () => {
  let service: PaginationService;
  let nestService: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nest: NestService) =>
            new PaginationService(nest, new SpatieResponseStrategy())
        }
      ]
    });
    service = TestBed.inject(PaginationService);
    nestService = TestBed.inject(NestService);
  });

  it('should sync page and lastPage after a paginated response', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    service.paginate({
      data: [{}],
      current_page: 3,
      last_page: 7
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const state = nestService.nest();
    expect(state.page).toBe(3);
    expect(state.lastPage).toBe(7);
    expect(state.isLastPageKnown).toBe(true);
  });

  it('should leave isLastPageKnown false when server emits lastPage 0 (empty collection)', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    service.paginate({
      data: [],
      current_page: 1,
      last_page: 0
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const state = nestService.nest();
    expect(state.page).toBe(1);
    expect(state.isLastPageKnown).toBe(false);
  });

  it('should leave isLastPageKnown false when last_page is absent', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    service.paginate({
      data: [{}],
      current_page: 2
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const state = nestService.nest();
    expect(state.page).toBe(2);
    expect(state.isLastPageKnown).toBe(false);
  });
});

describe('PaginationService auto-sync (Laravel)', () => {
  let service: PaginationService;
  let nestService: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nest: NestService) =>
            new PaginationService(nest, new LaravelResponseStrategy())
        }
      ]
    });
    service = TestBed.inject(PaginationService);
    nestService = TestBed.inject(NestService);
  });

  it('should sync page and lastPage after a paginated response', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    service.paginate({
      data: [{}],
      current_page: 4,
      last_page: 10
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const state = nestService.nest();
    expect(state.page).toBe(4);
    expect(state.lastPage).toBe(10);
    expect(state.isLastPageKnown).toBe(true);
  });
});

describe('PaginationService auto-sync (NestJS)', () => {
  let service: PaginationService;
  let nestService: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nest: NestService) =>
            new PaginationService(nest, new NestjsResponseStrategy(), new NestjsResponseOptions({}))
        }
      ]
    });
    service = TestBed.inject(PaginationService);
    nestService = TestBed.inject(NestService);
  });

  it('should sync page and lastPage after a paginated response', () => {
    service.paginate({
      data: [{}],
      meta: {
        currentPage: 2,
        totalPages: 5,
        itemsPerPage: 10,
        totalItems: 50
      }
    });

    const state = nestService.nest();
    expect(state.page).toBe(2);
    expect(state.lastPage).toBe(5);
    expect(state.isLastPageKnown).toBe(true);
  });

  it('should leave isLastPageKnown false when totalPages is 0', () => {
    service.paginate({
      data: [],
      meta: {
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: 10,
        totalItems: 0
      }
    });

    const state = nestService.nest();
    expect(state.page).toBe(1);
    expect(state.isLastPageKnown).toBe(false);
  });
});

describe('PaginationService auto-sync (JSON:API)', () => {
  let service: PaginationService;
  let nestService: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: PaginationService,
          useFactory: (nest: NestService) =>
            new PaginationService(nest, new JsonApiResponseStrategy(), new JsonApiResponseOptions({}))
        }
      ]
    });
    service = TestBed.inject(PaginationService);
    nestService = TestBed.inject(NestService);
  });

  it('should sync page and lastPage after a paginated response', () => {
    service.paginate({
      data: [{}],
      meta: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'current-page': 3,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'page-count': 9
      }
    });

    const state = nestService.nest();
    expect(state.page).toBe(3);
    expect(state.lastPage).toBe(9);
    expect(state.isLastPageKnown).toBe(true);
  });
});

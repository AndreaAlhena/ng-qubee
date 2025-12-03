import { TestBed } from '@angular/core/testing';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: PaginationService,
        useFactory: () =>
          new PaginationService()
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

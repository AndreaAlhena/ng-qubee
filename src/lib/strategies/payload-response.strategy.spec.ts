import { PayloadResponseOptions } from '../models/response-options';
import { PayloadResponseStrategy } from './payload-response.strategy';

describe('PayloadResponseStrategy', () => {
  let strategy: PayloadResponseStrategy;
  let options: PayloadResponseOptions;

  beforeEach(() => {
    strategy = new PayloadResponseStrategy();
    options = new PayloadResponseOptions({});
  });

  it('should parse a minimal Payload response', () => {
    const response = {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10,
      page: 1,
      pagingCounter: 1,
      totalDocs: 0,
      totalPages: 1
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical middle-page response', () => {
    const response = {
      docs: [{ id: 'a11' }, { id: 'a12' }, { id: 'a13' }, { id: 'a14' }, { id: 'a15' }, { id: 'a16' }, { id: 'a17' }, { id: 'a18' }, { id: 'a19' }, { id: 'a20' }],
      hasNextPage: true,
      hasPrevPage: true,
      limit: 10,
      nextPage: 3,
      page: 2,
      pagingCounter: 11,
      prevPage: 1,
      totalDocs: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(10);
    expect(collection.total).toBe(48);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.from).toBe(11);
    expect(collection.to).toBe(20);
    expect(collection.nextPageUrl).toBeUndefined();
    expect(collection.prevPageUrl).toBeUndefined();
  });

  it('should map pagingCounter straight onto from', () => {
    const response = {
      docs: [{ id: 'b41' }],
      limit: 10,
      page: 5,
      pagingCounter: 41,
      totalDocs: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(41);
  });

  it('should clamp to against the total on the last page', () => {
    const response = {
      docs: [{ id: 'c41' }],
      limit: 10,
      page: 5,
      pagingCounter: 41,
      totalDocs: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.to).toBe(48);
  });

  it('should honour overridden envelope keys', () => {
    const custom = new PayloadResponseOptions({
      currentPage: 'meta.page',
      data: 'results',
      from: '',
      lastPage: 'meta.pages',
      perPage: 'meta.size',
      total: 'meta.count'
    });
    const response = {
      meta: { count: 30, page: 2, pages: 3, size: 10 },
      results: [{ id: 'd1' }]
    };

    const collection = strategy.paginate(response, custom);

    expect(collection.data).toHaveSize(1);
    expect(collection.total).toBe(30);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(3);
    expect(collection.from).toBe(11);
  });
});

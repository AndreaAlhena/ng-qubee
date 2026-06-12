import { SieveResponseOptions } from '../models/response-options';
import { SieveResponseStrategy } from './sieve-response.strategy';

describe('SieveResponseStrategy', () => {
  let strategy: SieveResponseStrategy;
  let options: SieveResponseOptions;

  beforeEach(() => {
    strategy = new SieveResponseStrategy();
    options = new SieveResponseOptions({});
  });

  it('parses a minimal PagedResult-shaped response', () => {
    const response = {
      data: [],
      page: 1
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('parses the default { data, page, pageSize, total, totalPages } shape', () => {
    const response = {
      data: [
        { id: 1, title: 'Hello' },
        { id: 2, title: 'World' }
      ],
      page: 2,
      pageSize: 10,
      total: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.total).toBe(48);
    expect(collection.lastPage).toBe(5);
  });

  it('computes from and to from page/pageSize/total', () => {
    const response = {
      data: [{ id: 1 }],
      page: 3,
      pageSize: 10,
      total: 100,
      totalPages: 10
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('caps `to` at total on the last page', () => {
    const response = {
      data: [{ id: 1 }],
      page: 4,
      pageSize: 10,
      total: 35,
      totalPages: 4
    };

    const collection = strategy.paginate(response, options);

    expect(collection.to).toBe(35);
  });

  it('leaves navigation links undefined by default', () => {
    const response = {
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    };

    const collection = strategy.paginate(response, options);

    expect(collection.firstPageUrl).toBeUndefined();
    expect(collection.prevPageUrl).toBeUndefined();
    expect(collection.nextPageUrl).toBeUndefined();
    expect(collection.lastPageUrl).toBeUndefined();
  });

  it('maps a nested wrapper shape via dot-notation overrides', () => {
    const customOptions = new SieveResponseOptions({
      currentPage: 'meta.page',
      data: 'items',
      lastPage: 'meta.pages',
      perPage: 'meta.size',
      total: 'meta.count'
    });
    const response = {
      items: [{ id: 1 }],
      meta: { page: 4, size: 20, count: 99, pages: 5 }
    };

    const collection = strategy.paginate(response, customOptions);

    expect(collection.data).toHaveSize(1);
    expect(collection.page).toBe(4);
    expect(collection.perPage).toBe(20);
    expect(collection.total).toBe(99);
    expect(collection.lastPage).toBe(5);
  });

  it('normalizes the collection to a page-keyed id map', () => {
    const response = {
      data: [{ id: 7 }, { id: 9 }],
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1
    };

    const collection = strategy.paginate(response, options);

    expect(collection.normalize()[1]).toEqual([7, 9]);
  });
});

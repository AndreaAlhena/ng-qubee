import { PocketbaseResponseOptions } from '../models/response-options';
import { PocketbaseResponseStrategy } from './pocketbase-response.strategy';

describe('PocketbaseResponseStrategy', () => {
  let strategy: PocketbaseResponseStrategy;
  let options: PocketbaseResponseOptions;

  beforeEach(() => {
    strategy = new PocketbaseResponseStrategy();
    options = new PocketbaseResponseOptions({});
  });

  it('should parse a minimal PocketBase response', () => {
    const response = { items: [], page: 1, perPage: 30, totalItems: 0, totalPages: 0 };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical first-page response', () => {
    const response = {
      items: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }, { id: 'a4' }, { id: 'a5' }, { id: 'a6' }, { id: 'a7' }, { id: 'a8' }, { id: 'a9' }, { id: 'a10' }],
      page: 1,
      perPage: 10,
      totalItems: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(10);
    expect(collection.total).toBe(48);
    expect(collection.page).toBe(1);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(10);
    expect(collection.nextPageUrl).toBeUndefined();
    expect(collection.prevPageUrl).toBeUndefined();
  });

  it('should compute from/to on a middle page', () => {
    const response = {
      items: [{ id: 'b1' }],
      page: 3,
      perPage: 10,
      totalItems: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.page).toBe(3);
    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('should clamp to against the total on the last page', () => {
    const response = {
      items: [{ id: 'c1' }],
      page: 5,
      perPage: 10,
      totalItems: 48,
      totalPages: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(41);
    expect(collection.to).toBe(48);
  });

  it('should honour overridden envelope keys', () => {
    const custom = new PocketbaseResponseOptions({
      currentPage: 'meta.page',
      data: 'records',
      lastPage: 'meta.pages',
      perPage: 'meta.size',
      total: 'meta.count'
    });
    const response = {
      meta: { count: 30, page: 2, pages: 3, size: 10 },
      records: [{ id: 'd1' }]
    };

    const collection = strategy.paginate(response, custom);

    expect(collection.data).toHaveSize(1);
    expect(collection.total).toBe(30);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(3);
  });
});

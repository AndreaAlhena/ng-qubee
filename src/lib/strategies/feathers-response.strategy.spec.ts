import { FeathersResponseOptions } from '../models/response-options';
import { FeathersResponseStrategy } from './feathers-response.strategy';

describe('FeathersResponseStrategy', () => {
  let strategy: FeathersResponseStrategy;
  let options: FeathersResponseOptions;

  beforeEach(() => {
    strategy = new FeathersResponseStrategy();
    options = new FeathersResponseOptions({});
  });

  it('should parse a minimal Feathers response', () => {
    const response = { data: [], limit: 10, skip: 0, total: 0 };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical first-page response', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }],
      limit: 10,
      skip: 0,
      total: 48
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

  describe('current page derivation', () => {
    it('should derive the page from skip and limit', () => {
      const response = { data: [{ id: 21 }], limit: 10, skip: 20, total: 48 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(3);
    });

    it('should fall back to page 1 when limit is zero (count-only query)', () => {
      const response = { data: [], limit: 0, skip: 0, total: 48 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
      expect(collection.lastPage).toBeUndefined();
    });

    it('should fall back to page 1 when skip is absent', () => {
      const response = { data: [{ id: 1 }], limit: 10, total: 48 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });
  });

  describe('from/to derivation', () => {
    it('should compute 1-indexed bounds on a middle page', () => {
      const response = {
        data: [{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 }, { id: 16 }, { id: 17 }, { id: 18 }, { id: 19 }, { id: 20 }],
        limit: 10,
        skip: 10,
        total: 48
      };
      const collection = strategy.paginate(response, options);

      expect(collection.from).toBe(11);
      expect(collection.to).toBe(20);
    });

    it('should size the bounds from the item count on a partial last page', () => {
      const response = {
        data: [{ id: 41 }, { id: 42 }, { id: 43 }, { id: 44 }, { id: 45 }, { id: 46 }, { id: 47 }, { id: 48 }],
        limit: 10,
        skip: 40,
        total: 48
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(5);
      expect(collection.from).toBe(41);
      expect(collection.to).toBe(48);
    });

    it('should leave from/to undefined on an empty page', () => {
      const response = { data: [], limit: 10, skip: 50, total: 48 };
      const collection = strategy.paginate(response, options);

      expect(collection.from).toBeUndefined();
      expect(collection.to).toBeUndefined();
    });
  });

  describe('last page derivation', () => {
    it('should round the last page up for a partial final page', () => {
      const response = { data: [{ id: 1 }], limit: 10, skip: 0, total: 41 };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(5);
    });

    it('should leave lastPage undefined when the total is absent', () => {
      const response = { data: [{ id: 1 }], limit: 10, skip: 0 };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBeUndefined();
    });
  });

  describe('custom envelope keys', () => {
    it('should honour overridden envelope keys', () => {
      const custom = new FeathersResponseOptions({
        data: 'results',
        perPage: 'pageSize',
        total: 'count'
      });
      const response = {
        count: 30,
        pageSize: 10,
        results: [{ id: 11 }],
        skip: 10
      };

      const collection = strategy.paginate(response, custom);

      expect(collection.data).toHaveSize(1);
      expect(collection.total).toBe(30);
      expect(collection.perPage).toBe(10);
      expect(collection.page).toBe(2);
    });
  });
});

import { JsonServerResponseOptions } from '../models/response-options';
import { JsonServerResponseStrategy } from './json-server-response.strategy';

describe('JsonServerResponseStrategy', () => {
  let strategy: JsonServerResponseStrategy;
  let options: JsonServerResponseOptions;

  beforeEach(() => {
    strategy = new JsonServerResponseStrategy();
    options = new JsonServerResponseOptions({});
  });

  it('should parse a minimal json-server response', () => {
    const response = {
      data: [],
      first: 1,
      items: 0,
      last: 1,
      next: null,
      pages: 0,
      prev: null
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical first-page response', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }],
      first: 1,
      items: 48,
      last: 5,
      next: 2,
      pages: 5,
      prev: null
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
    it('should report page 1 when prev is null', () => {
      const response = { data: [], items: 48, next: 2, pages: 5, prev: null };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should report prev + 1 when prev is a page number', () => {
      const response = { data: [], items: 48, next: 4, pages: 5, prev: 2 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(3);
    });

    it('should report the last page from prev when next is null', () => {
      const response = { data: [{ id: 41 }], items: 41, next: null, pages: 5, prev: 4 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(5);
    });
  });

  describe('per-page derivation', () => {
    it('should use the item count of a page that has a successor', () => {
      const response = {
        data: [{ id: 11 }, { id: 12 }, { id: 13 }],
        items: 7,
        next: 2,
        pages: 3,
        prev: null
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(3);
    });

    it('should leave perPage undefined on the last page of a multi-page set', () => {
      const response = { data: [{ id: 41 }], items: 41, next: null, pages: 5, prev: 4 };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBeUndefined();
    });
  });

  describe('from/to derivation', () => {
    it('should compute from/to on a full middle page', () => {
      const response = {
        data: Array.from({ length: 10 }, (_, i) => ({ id: 21 + i })),
        items: 48,
        next: 4,
        pages: 5,
        prev: 2
      };
      const collection = strategy.paginate(response, options);

      expect(collection.from).toBe(21);
      expect(collection.to).toBe(30);
    });

    it('should count back from the total on the last page', () => {
      const response = {
        data: Array.from({ length: 8 }, (_, i) => ({ id: 41 + i })),
        items: 48,
        next: null,
        pages: 5,
        prev: 4
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(5);
      expect(collection.from).toBe(41);
      expect(collection.to).toBe(48);
    });

    it('should cover the whole set on a single-page response', () => {
      const response = {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        items: 3,
        next: null,
        pages: 1,
        prev: null
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
      expect(collection.lastPage).toBe(1);
      expect(collection.from).toBe(1);
      expect(collection.to).toBe(3);
    });
  });

  describe('custom key names', () => {
    it('should honour overridden envelope keys', () => {
      const customOptions = new JsonServerResponseOptions({
        data: 'rows',
        lastPage: 'pageCount',
        total: 'totalRows'
      });
      const response = {
        next: 2,
        pageCount: 4,
        prev: null,
        rows: [{ id: 1 }, { id: 2 }],
        totalRows: 8
      };
      const collection = strategy.paginate(response, customOptions);

      expect(collection.data).toHaveSize(2);
      expect(collection.total).toBe(8);
      expect(collection.lastPage).toBe(4);
      expect(collection.page).toBe(1);
      expect(collection.perPage).toBe(2);
    });
  });
});

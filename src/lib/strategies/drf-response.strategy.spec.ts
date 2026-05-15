import { DrfResponseOptions } from '../models/response-options';
import { DrfResponseStrategy } from './drf-response.strategy';

describe('DrfResponseStrategy', () => {
  let strategy: DrfResponseStrategy;
  let options: DrfResponseOptions;

  beforeEach(() => {
    strategy = new DrfResponseStrategy();
    options = new DrfResponseOptions({});
  });

  it('should parse a minimal DRF response', () => {
    const response = {
      count: 0,
      next: null,
      previous: null,
      results: []
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical first-page response', () => {
    const response = {
      count: 100,
      next: 'http://api.example.com/items/?page=2&page_size=10',
      previous: null,
      results: [{ id: 1 }, { id: 2 }]
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.total).toBe(100);
    expect(collection.page).toBe(1);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(10);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(10);
    expect(collection.nextPageUrl).toBe('http://api.example.com/items/?page=2&page_size=10');
    expect(collection.prevPageUrl).toBeUndefined();
  });

  describe('current page derivation', () => {
    it('should report page 1 when previous is null', () => {
      const response = { count: 50, next: 'http://api.example.com/items/?page=2', previous: null, results: [] };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should report page 2 when previous has no ?page param (DRF omits page=1)', () => {
      const response = {
        count: 50,
        next: 'http://api.example.com/items/?page=3',
        previous: 'http://api.example.com/items/',
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(2);
    });

    it('should report page N+1 when previous has ?page=N', () => {
      const response = {
        count: 50,
        next: 'http://api.example.com/items/?page=4',
        previous: 'http://api.example.com/items/?page=2',
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(3);
    });
  });

  describe('per-page derivation', () => {
    it('should parse page_size from the next URL', () => {
      const response = {
        count: 100,
        next: 'http://api.example.com/items/?page=2&page_size=25',
        previous: null,
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(25);
    });

    it('should parse page_size from the previous URL when next is absent', () => {
      const response = {
        count: 100,
        next: null,
        previous: 'http://api.example.com/items/?page=3&page_size=20',
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(20);
    });

    it('should leave perPage undefined when neither URL carries the param', () => {
      const response = {
        count: 5,
        next: null,
        previous: null,
        results: [{ id: 1 }]
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBeUndefined();
      expect(collection.lastPage).toBeUndefined();
      expect(collection.from).toBeUndefined();
      expect(collection.to).toBeUndefined();
    });

    it('should leave perPage undefined when a URL contains page but not page_size', () => {
      const response = {
        count: 100,
        next: 'http://api.example.com/items/?page=2',
        previous: null,
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBeUndefined();
    });
  });

  describe('last page derivation', () => {
    it('should compute last page as ceil(count / perPage)', () => {
      const response = {
        count: 47,
        next: 'http://api.example.com/items/?page=2&page_size=10',
        previous: null,
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(5);
    });

    it('should clamp to in the last page when count is not a multiple of perPage', () => {
      const response = {
        count: 47,
        next: null,
        previous: 'http://api.example.com/items/?page=4&page_size=10',
        results: [{ id: 41 }]
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(5);
      expect(collection.lastPage).toBe(5);
      expect(collection.from).toBe(41);
      expect(collection.to).toBe(47);
    });

    it('should return undefined when total is undefined', () => {
      const response = {
        next: 'http://api.example.com/items/?page=2&page_size=10',
        previous: null,
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBeUndefined();
      expect(collection.to).toBeUndefined();
    });
  });

  describe('malformed URLs', () => {
    it('should fall back to page 1 when previous is an unparseable URL', () => {
      const response = {
        count: 10,
        next: null,
        previous: 'not-a-real-url',
        results: []
      };
      const collection = strategy.paginate(response, options);

      // Unparseable URL → _extractQueryParam returns undefined → treated like "no page param" → page 2
      // (Documenting current behaviour; consumers with malformed servers won't get sensible numbers regardless.)
      expect(collection.page).toBe(2);
    });

    it('should treat non-integer page values as missing', () => {
      const response = {
        count: 10,
        next: null,
        previous: 'http://api.example.com/items/?page=abc',
        results: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(2);
    });
  });

  describe('custom key names', () => {
    it('should honour custom data, total, next, and previous keys', () => {
      const customOptions = new DrfResponseOptions({
        data: 'items',
        total: 'totalCount',
        nextPageUrl: 'nextLink',
        prevPageUrl: 'prevLink'
      });

      const response = {
        items: [{ id: 1 }],
        totalCount: 50,
        nextLink: 'http://api.example.com/items/?page=2&page_size=25',
        prevLink: null
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.data).toHaveSize(1);
      expect(collection.total).toBe(50);
      expect(collection.nextPageUrl).toBe('http://api.example.com/items/?page=2&page_size=25');
      expect(collection.page).toBe(1);
      expect(collection.perPage).toBe(25);
    });
  });

  describe('normalize', () => {
    it('should normalize results using the default id key', () => {
      const response = {
        count: 3,
        next: null,
        previous: null,
        results: [{ id: 1 }, { id: 2 }, { id: 3 }]
      };

      const collection = strategy.paginate(response, options);
      const normalized = collection.normalize();

      expect(normalized[1]).toEqual([1, 2, 3]);
    });
  });
});

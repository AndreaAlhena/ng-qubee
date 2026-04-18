/* eslint-disable @typescript-eslint/naming-convention */
import { JsonApiResponseOptions, ResponseOptions } from '../models/response-options';
import { JsonApiResponseStrategy } from './json-api-response.strategy';

describe('JsonApiResponseStrategy', () => {
  let strategy: JsonApiResponseStrategy;
  let options: JsonApiResponseOptions;

  beforeEach(() => {
    strategy = new JsonApiResponseStrategy();
    options = new JsonApiResponseOptions({});
  });

  it('should parse a minimal JSON:API response', () => {
    const response = {
      data: [],
      meta: { 'current-page': 1 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a full JSON:API response', () => {
    const response = {
      data: [{ id: 1, type: 'articles', attributes: { title: 'Test' } }, { id: 2, type: 'articles', attributes: { title: 'Test 2' } }],
      meta: {
        'current-page': 2,
        'per-page': 10,
        'page-count': 5,
        total: 50,
        from: 11,
        to: 20
      },
      links: {
        first: 'http://api.com/articles?page[number]=1&page[size]=10',
        prev: 'http://api.com/articles?page[number]=1&page[size]=10',
        next: 'http://api.com/articles?page[number]=3&page[size]=10',
        last: 'http://api.com/articles?page[number]=5&page[size]=10'
      }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(2);
    expect(collection.total).toBe(50);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.from).toBe(11);
    expect(collection.to).toBe(20);
    expect(collection.firstPageUrl).toBe('http://api.com/articles?page[number]=1&page[size]=10');
    expect(collection.prevPageUrl).toBe('http://api.com/articles?page[number]=1&page[size]=10');
    expect(collection.nextPageUrl).toBe('http://api.com/articles?page[number]=3&page[size]=10');
    expect(collection.lastPageUrl).toBe('http://api.com/articles?page[number]=5&page[size]=10');
  });

  it('should compute from and to values when not present in meta', () => {
    const response = {
      data: [{ id: 1 }],
      meta: {
        'current-page': 3,
        'per-page': 10,
        'page-count': 10,
        total: 100
      },
      links: {}
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('should handle last page where to does not exceed total', () => {
    const response = {
      data: [{ id: 1 }],
      meta: {
        'current-page': 4,
        'per-page': 10,
        'page-count': 4,
        total: 35
      },
      links: {}
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(31);
    expect(collection.to).toBe(35);
  });

  it('should handle first page correctly', () => {
    const response = {
      data: [{ id: 1 }],
      meta: {
        'current-page': 1,
        'per-page': 10,
        'page-count': 10,
        total: 100
      },
      links: {}
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(1);
    expect(collection.to).toBe(10);
  });

  it('should handle null link values', () => {
    const response = {
      data: [],
      meta: {
        'current-page': 1,
        'per-page': 10,
        'page-count': 1,
        total: 5
      },
      links: {
        first: 'http://api.com/articles?page[number]=1&page[size]=10',
        prev: null,
        next: null,
        last: 'http://api.com/articles?page[number]=1&page[size]=10'
      }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.prevPageUrl).toBeNull();
    expect(collection.nextPageUrl).toBeNull();
    expect(collection.firstPageUrl).toBe('http://api.com/articles?page[number]=1&page[size]=10');
    expect(collection.lastPageUrl).toBe('http://api.com/articles?page[number]=1&page[size]=10');
  });

  it('should handle empty data array', () => {
    const response = {
      data: [],
      meta: {
        'current-page': 1,
        'per-page': 10,
        'page-count': 0,
        total: 0
      },
      links: {}
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
  });

  it('should handle single page response', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        'current-page': 1,
        'per-page': 10,
        'page-count': 1,
        total: 2
      },
      links: {
        first: 'http://api.com/articles?page[number]=1&page[size]=10',
        prev: null,
        next: null,
        last: 'http://api.com/articles?page[number]=1&page[size]=10'
      }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(1);
    expect(collection.lastPage).toBe(1);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(2);
  });

  // Custom key names
  describe('custom key names', () => {
    it('should use custom meta paths', () => {
      const customOptions = new JsonApiResponseOptions({
        currentPage: 'pagination.page',
        total: 'pagination.total',
        perPage: 'pagination.perPage'
      });

      const response = {
        data: [{ id: 1 }],
        pagination: {
          page: 3,
          total: 50,
          perPage: 25
        }
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.page).toBe(3);
      expect(collection.total).toBe(50);
      expect(collection.perPage).toBe(25);
    });

    it('should use custom data key', () => {
      const customOptions = new JsonApiResponseOptions({ data: 'items' });

      const response = {
        items: [{ id: 1 }, { id: 2 }],
        meta: { 'current-page': 1 }
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.data).toHaveSize(2);
    });
  });

  // Normalization
  describe('normalize', () => {
    it('should normalize data using the default id key', () => {
      const response = {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        meta: {
          'current-page': 1,
          'per-page': 10,
          'page-count': 1,
          total: 3
        },
        links: {}
      };

      const collection = strategy.paginate(response, options);
      const normalized = collection.normalize();

      expect(normalized[1]).toEqual([1, 2, 3]);
    });
  });

  // Direct from/to in response
  describe('direct from/to values', () => {
    it('should use from/to from response when present in meta', () => {
      const customOptions = new ResponseOptions({
        currentPage: 'meta.current-page',
        data: 'data',
        from: 'meta.from',
        to: 'meta.to',
        total: 'meta.total',
        perPage: 'meta.per-page',
        lastPage: 'meta.page-count',
        firstPageUrl: 'links.first',
        lastPageUrl: 'links.last',
        nextPageUrl: 'links.next',
        prevPageUrl: 'links.prev'
      });

      const response = {
        data: [{ id: 1 }],
        meta: {
          'current-page': 2,
          from: 11,
          to: 20,
          total: 100,
          'per-page': 10,
          'page-count': 10
        },
        links: {}
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.from).toBe(11);
      expect(collection.to).toBe(20);
    });
  });

  // Missing meta fields
  describe('missing meta fields', () => {
    it('should handle response with missing optional meta fields', () => {
      const response = {
        data: [{ id: 1 }],
        meta: {
          'current-page': 1
        }
      };

      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
      expect(collection.total).toBeUndefined();
      expect(collection.perPage).toBeUndefined();
      expect(collection.lastPage).toBeUndefined();
    });
  });
});

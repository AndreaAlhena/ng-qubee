import { NestjsResponseOptions, ResponseOptions } from '../models/response-options';
import { NestjsResponseStrategy } from './nestjs-response.strategy';

describe('NestjsResponseStrategy', () => {
  let strategy: NestjsResponseStrategy;
  let options: NestjsResponseOptions;

  beforeEach(() => {
    strategy = new NestjsResponseStrategy();
    options = new NestjsResponseOptions({});
  });

  it('should parse a minimal NestJS response', () => {
    const response = {
      data: [],
      meta: { currentPage: 1 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a full NestJS response', () => {
    const response = {
      data: [{ id: 1, name: 'Test' }, { id: 2, name: 'Test 2' }],
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
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(2);
    expect(collection.total).toBe(50);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.firstPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.prevPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.nextPageUrl).toBe('http://api.com/users?page=3');
    expect(collection.lastPageUrl).toBe('http://api.com/users?page=5');
  });

  it('should compute from and to values from meta', () => {
    const response = {
      data: [{ id: 1 }],
      meta: {
        currentPage: 3,
        totalItems: 100,
        itemsPerPage: 10,
        totalPages: 10
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
        currentPage: 4,
        totalItems: 35,
        itemsPerPage: 10,
        totalPages: 4
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
        currentPage: 1,
        totalItems: 100,
        itemsPerPage: 10,
        totalPages: 10
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
    };

    const collection = strategy.paginate(response, options);

    expect(collection.prevPageUrl).toBeNull();
    expect(collection.nextPageUrl).toBeNull();
    expect(collection.firstPageUrl).toBe('http://api.com/users?page=1');
    expect(collection.lastPageUrl).toBe('http://api.com/users?page=1');
  });

  it('should handle empty data array', () => {
    const response = {
      data: [],
      meta: {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 10,
        totalPages: 0
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
        currentPage: 1,
        totalItems: 2,
        itemsPerPage: 10,
        totalPages: 1
      },
      links: {
        first: 'http://api.com/users?page=1',
        previous: null,
        next: null,
        last: 'http://api.com/users?page=1'
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
      const customOptions = new NestjsResponseOptions({
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
      const customOptions = new NestjsResponseOptions({ data: 'items' });

      const response = {
        items: [{ id: 1 }, { id: 2 }],
        meta: { currentPage: 1 }
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
          currentPage: 1,
          totalItems: 3,
          itemsPerPage: 10,
          totalPages: 1
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
        currentPage: 'meta.currentPage',
        data: 'data',
        from: 'meta.from',
        to: 'meta.to',
        total: 'meta.totalItems',
        perPage: 'meta.itemsPerPage',
        lastPage: 'meta.totalPages',
        firstPageUrl: 'links.first',
        lastPageUrl: 'links.last',
        nextPageUrl: 'links.next',
        prevPageUrl: 'links.previous'
      });

      const response = {
        data: [{ id: 1 }],
        meta: {
          currentPage: 2,
          from: 11,
          to: 20,
          totalItems: 100,
          itemsPerPage: 10,
          totalPages: 10
        },
        links: {}
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.from).toBe(11);
      expect(collection.to).toBe(20);
    });
  });
});

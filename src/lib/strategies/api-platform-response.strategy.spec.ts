/* eslint-disable @typescript-eslint/naming-convention -- Hydra envelope keys (`hydra:member`, `@id`) are fixed by the wire format */
import { ApiPlatformResponseOptions } from '../models/response-options';
import { ApiPlatformResponseStrategy } from './api-platform-response.strategy';

describe('ApiPlatformResponseStrategy', () => {
  let strategy: ApiPlatformResponseStrategy;
  let options: ApiPlatformResponseOptions;

  beforeEach(() => {
    strategy = new ApiPlatformResponseStrategy();
    options = new ApiPlatformResponseOptions({});
  });

  it('should parse a minimal Hydra response without a view', () => {
    const response = {
      'hydra:member': [],
      'hydra:totalItems': 0
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical mid-collection page', () => {
    const response = {
      'hydra:member': [{ id: 21 }, { id: 22 }],
      'hydra:totalItems': 48,
      'hydra:view': {
        '@id': '/books?page=3&itemsPerPage=10',
        'hydra:first': '/books?page=1&itemsPerPage=10',
        'hydra:last': '/books?page=5&itemsPerPage=10',
        'hydra:next': '/books?page=4&itemsPerPage=10',
        'hydra:previous': '/books?page=2&itemsPerPage=10'
      }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.total).toBe(48);
    expect(collection.page).toBe(3);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
    expect(collection.firstPageUrl).toBe('/books?page=1&itemsPerPage=10');
    expect(collection.lastPageUrl).toBe('/books?page=5&itemsPerPage=10');
    expect(collection.nextPageUrl).toBe('/books?page=4&itemsPerPage=10');
    expect(collection.prevPageUrl).toBe('/books?page=2&itemsPerPage=10');
  });

  describe('current page derivation', () => {
    it('should read the page param from the view @id', () => {
      const response = {
        'hydra:member': [],
        'hydra:totalItems': 48,
        'hydra:view': { '@id': '/books?page=4' }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(4);
    });

    it('should fall back to page 1 when the view @id has no page param', () => {
      const response = {
        'hydra:member': [{ id: 1 }],
        'hydra:totalItems': 1,
        'hydra:view': { '@id': '/books' }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should fall back to page 1 when the view is absent', () => {
      const response = { 'hydra:member': [{ id: 1 }], 'hydra:totalItems': 1 };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });
  });

  describe('per-page derivation', () => {
    it('should read perPage from the view @id itemsPerPage param', () => {
      const response = {
        'hydra:member': [],
        'hydra:totalItems': 48,
        'hydra:view': { '@id': '/books?page=1&itemsPerPage=25' }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(25);
    });

    it('should fall back to the item count when a next link exists', () => {
      const response = {
        'hydra:member': [{ id: 1 }, { id: 2 }, { id: 3 }],
        'hydra:totalItems': 48,
        'hydra:view': {
          '@id': '/books?page=1',
          'hydra:next': '/books?page=2'
        }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(3);
    });

    it('should leave perPage undefined on the last page without itemsPerPage', () => {
      const response = {
        'hydra:member': [{ id: 41 }],
        'hydra:totalItems': 41,
        'hydra:view': { '@id': '/books?page=5' }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBeUndefined();
    });
  });

  describe('last page derivation', () => {
    it('should read lastPage from the hydra:last URL', () => {
      const response = {
        'hydra:member': [],
        'hydra:totalItems': 48,
        'hydra:view': {
          '@id': '/books?page=2',
          'hydra:last': '/books?page=5'
        }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(5);
    });

    it('should compute lastPage as ceil(total / perPage) without a hydra:last link', () => {
      const response = {
        'hydra:member': [],
        'hydra:totalItems': 95,
        'hydra:view': { '@id': '/books?page=1&itemsPerPage=10' }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(10);
    });

    it('should resolve lastPage to 1 on a view-less single-page result', () => {
      const response = {
        'hydra:member': [{ id: 1 }, { id: 2 }, { id: 3 }],
        'hydra:totalItems': 3
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(1);
      expect(collection.from).toBe(1);
      expect(collection.to).toBe(3);
    });
  });

  describe('relative URLs', () => {
    it('should parse page params out of relative Hydra links', () => {
      const response = {
        'hydra:member': [],
        'hydra:totalItems': 50,
        'hydra:view': {
          '@id': 'books?page=2&itemsPerPage=10',
          'hydra:last': 'books?page=5'
        }
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(2);
      expect(collection.perPage).toBe(10);
      expect(collection.lastPage).toBe(5);
    });
  });

  describe('custom key names', () => {
    it('should honour overridden envelope paths', () => {
      const customOptions = new ApiPlatformResponseOptions({
        data: 'member',
        nextPageUrl: 'view.next',
        path: 'view.id',
        total: 'totalItems'
      });
      const response = {
        member: [{ id: 1 }],
        totalItems: 42,
        view: {
          id: '/books?page=1&itemsPerPage=10',
          next: '/books?page=2&itemsPerPage=10'
        }
      };
      const collection = strategy.paginate(response, customOptions);

      expect(collection.data).toHaveSize(1);
      expect(collection.total).toBe(42);
      expect(collection.page).toBe(1);
      expect(collection.perPage).toBe(10);
      expect(collection.lastPage).toBe(5);
      expect(collection.nextPageUrl).toBe('/books?page=2&itemsPerPage=10');
    });
  });
});

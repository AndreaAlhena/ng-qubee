/* eslint-disable @typescript-eslint/naming-convention -- Directus meta keys (`total_count`, `filter_count`) are fixed by the wire format */
import { DirectusResponseOptions } from '../models/response-options';
import { DirectusResponseStrategy } from './directus-response.strategy';

describe('DirectusResponseStrategy', () => {
  let strategy: DirectusResponseStrategy;
  let options: DirectusResponseOptions;

  beforeEach(() => {
    strategy = new DirectusResponseStrategy();
    options = new DirectusResponseOptions({});
  });

  it('should parse a minimal Directus response', () => {
    const response = {
      data: [],
      meta: { filter_count: 0, total_count: 0 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should read the total from meta.filter_count by default', () => {
    const response = {
      data: [{ id: 1 }],
      meta: { filter_count: 12, total_count: 48 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.total).toBe(12);
  });

  it('should resolve a single-page result completely', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      meta: { filter_count: 3, total_count: 48 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.page).toBe(1);
    expect(collection.lastPage).toBe(1);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(3);
    expect(collection.perPage).toBeUndefined();
  });

  it('should fall back to page 1 and leave derived fields undefined on a partial page', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { filter_count: 12, total_count: 48 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.page).toBe(1);
    expect(collection.lastPage).toBeUndefined();
    expect(collection.from).toBeUndefined();
    expect(collection.to).toBeUndefined();
    expect(collection.perPage).toBeUndefined();
  });

  it('should leave total undefined when meta was not requested', () => {
    const response = { data: [{ id: 1 }] };

    const collection = strategy.paginate(response, options);

    expect(collection.total).toBeUndefined();
    expect(collection.lastPage).toBeUndefined();
    expect(collection.page).toBe(1);
  });

  describe('custom key names', () => {
    it('should point total at meta.total_count when configured', () => {
      const customOptions = new DirectusResponseOptions({ total: 'meta.total_count' });
      const response = {
        data: [{ id: 1 }],
        meta: { filter_count: 12, total_count: 48 }
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.total).toBe(48);
    });

    it('should fully derive paging from a custom wrapper that includes page fields', () => {
      const customOptions = new DirectusResponseOptions({
        currentPage: 'paging.page',
        data: 'items',
        perPage: 'paging.size',
        total: 'paging.total'
      });
      const response = {
        items: [{ id: 11 }],
        paging: { page: 2, size: 10, total: 25 }
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.page).toBe(2);
      expect(collection.perPage).toBe(10);
      expect(collection.total).toBe(25);
      expect(collection.lastPage).toBe(3);
      expect(collection.from).toBe(11);
      expect(collection.to).toBe(20);
    });

    it('should honour a direct lastPage path over derivation', () => {
      const customOptions = new DirectusResponseOptions({ lastPage: 'meta.pages' });
      const response = {
        data: [{ id: 1 }],
        meta: { filter_count: 12, pages: 4, total_count: 48 }
      };

      const collection = strategy.paginate(response, customOptions);

      expect(collection.lastPage).toBe(4);
    });
  });
});

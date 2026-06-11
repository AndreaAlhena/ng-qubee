/* eslint-disable @typescript-eslint/naming-convention -- OData envelope keys (`@odata.count`, `@odata.nextLink`) are fixed by the wire format */
import { OdataResponseOptions } from '../models/response-options';
import { OdataResponseStrategy } from './odata-response.strategy';

describe('OdataResponseStrategy', () => {
  let strategy: OdataResponseStrategy;
  let options: OdataResponseOptions;

  beforeEach(() => {
    strategy = new OdataResponseStrategy();
    options = new OdataResponseOptions({});
  });

  it('should parse a minimal OData response', () => {
    const response = {
      '@odata.count': 0,
      value: []
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.total).toBe(0);
    expect(collection.page).toBe(1);
  });

  it('should parse a typical mid-collection page', () => {
    const response = {
      '@odata.count': 100,
      '@odata.nextLink': 'https://api.example.com/Products?$count=true&$top=10&$skip=30',
      value: [{ id: 21 }, { id: 22 }]
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.total).toBe(100);
    expect(collection.page).toBe(3);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(10);
    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
    expect(collection.nextPageUrl).toBe('https://api.example.com/Products?$count=true&$top=10&$skip=30');
    expect(collection.prevPageUrl).toBeUndefined();
  });

  describe('current page derivation', () => {
    it('should report page 1 when the nextLink skips one page', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'https://api.example.com/items?$top=10&$skip=10',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should report skip ÷ top when both params are present', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'https://api.example.com/items?$top=10&$skip=40',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(4);
    });

    it('should fall back to page 1 when the nextLink is absent', () => {
      const response = { '@odata.count': 50, value: [{ id: 1 }] };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should fall back to page 1 on $skiptoken-based server-driven paging', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'https://api.example.com/items?$skiptoken=abc123',
        value: [{ id: 1 }, { id: 2 }]
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(1);
    });

    it('should parse a relative nextLink', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'Products?$top=10&$skip=20',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(2);
    });
  });

  describe('per-page derivation', () => {
    it('should read perPage from the nextLink $top param', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'https://api.example.com/items?$top=25&$skip=25',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(25);
    });

    it('should fall back to the item count when the nextLink has no $top', () => {
      const response = {
        '@odata.count': 50,
        '@odata.nextLink': 'https://api.example.com/items?$skiptoken=abc123',
        value: [{ id: 1 }, { id: 2 }, { id: 3 }]
      };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBe(3);
    });

    it('should leave perPage undefined without a nextLink', () => {
      const response = { '@odata.count': 50, value: [{ id: 1 }] };
      const collection = strategy.paginate(response, options);

      expect(collection.perPage).toBeUndefined();
    });
  });

  describe('last page derivation', () => {
    it('should compute lastPage as ceil(total / perPage)', () => {
      const response = {
        '@odata.count': 95,
        '@odata.nextLink': 'https://api.example.com/items?$top=10&$skip=10',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(10);
    });

    it('should resolve lastPage to 1 on a single-page result', () => {
      const response = { '@odata.count': 3, value: [{ id: 1 }, { id: 2 }, { id: 3 }] };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBe(1);
      expect(collection.from).toBe(1);
      expect(collection.to).toBe(3);
    });

    it('should leave lastPage undefined on a link-less partial page', () => {
      const response = { '@odata.count': 50, value: [{ id: 41 }] };
      const collection = strategy.paginate(response, options);

      expect(collection.lastPage).toBeUndefined();
    });
  });

  describe('to clamping', () => {
    it('should clamp to at the total on the second-to-last page', () => {
      const response = {
        '@odata.count': 25,
        '@odata.nextLink': 'https://api.example.com/items?$top=10&$skip=20',
        value: []
      };
      const collection = strategy.paginate(response, options);

      expect(collection.page).toBe(2);
      expect(collection.to).toBe(20);
    });
  });

  describe('missing count', () => {
    it('should leave total undefined when $count was not requested', () => {
      const response = {
        '@odata.nextLink': 'https://api.example.com/items?$top=10&$skip=10',
        value: [{ id: 1 }]
      };
      const collection = strategy.paginate(response, options);

      expect(collection.total).toBeUndefined();
      expect(collection.lastPage).toBeUndefined();
      expect(collection.perPage).toBe(10);
    });
  });

  describe('custom key names', () => {
    it('should honour overridden envelope keys', () => {
      const customOptions = new OdataResponseOptions({
        data: 'items',
        nextPageUrl: 'nextLink',
        total: 'totalCount'
      });
      const response = {
        items: [{ id: 1 }],
        nextLink: 'https://api.example.com/items?$top=10&$skip=10',
        totalCount: 42
      };
      const collection = strategy.paginate(response, customOptions);

      expect(collection.data).toHaveSize(1);
      expect(collection.total).toBe(42);
      expect(collection.page).toBe(1);
      expect(collection.perPage).toBe(10);
      expect(collection.lastPage).toBe(5);
    });
  });
});

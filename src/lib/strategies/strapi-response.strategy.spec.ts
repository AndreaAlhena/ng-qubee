import { StrapiResponseOptions } from '../models/response-options';
import { StrapiResponseStrategy } from './strapi-response.strategy';

describe('StrapiResponseStrategy', () => {
  let strategy: StrapiResponseStrategy;
  let options: StrapiResponseOptions;

  beforeEach(() => {
    strategy = new StrapiResponseStrategy();
    options = new StrapiResponseOptions({});
  });

  it('parses a minimal Strapi response', () => {
    const response = {
      data: [],
      meta: { pagination: { page: 1 } }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('parses a full Strapi v4/v5 response', () => {
    const response = {
      data: [
        { id: 1, documentId: 'a', title: 'Hello' },
        { id: 2, documentId: 'b', title: 'World' }
      ],
      meta: {
        pagination: {
          page: 2,
          pageSize: 10,
          pageCount: 5,
          total: 48
        }
      }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.total).toBe(48);
  });

  it('computes from and to from page/pageSize/total', () => {
    const response = {
      data: [{ id: 1 }],
      meta: { pagination: { page: 3, pageSize: 10, pageCount: 10, total: 100 } }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('caps `to` at total on the last page', () => {
    const response = {
      data: [{ id: 1 }],
      meta: { pagination: { page: 4, pageSize: 10, pageCount: 4, total: 35 } }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(31);
    expect(collection.to).toBe(35);
  });

  it('leaves navigation links undefined by default', () => {
    const response = {
      data: [],
      meta: { pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 } }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.firstPageUrl).toBeUndefined();
    expect(collection.prevPageUrl).toBeUndefined();
    expect(collection.nextPageUrl).toBeUndefined();
    expect(collection.lastPageUrl).toBeUndefined();
  });

  it('honours custom paths via IPaginationConfig overrides', () => {
    const customOptions = new StrapiResponseOptions({
      total: 'meta.totalCount'
    });

    const response = {
      data: [{ id: 1 }],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1 },
        totalCount: 7
      }
    };

    const collection = strategy.paginate(response, customOptions);

    expect(collection.total).toBe(7);
  });
});

import { NestjsxCrudResponseOptions } from '../models/response-options';
import { NestjsxCrudResponseStrategy } from './nestjsx-crud-response.strategy';

describe('NestjsxCrudResponseStrategy', () => {
  let strategy: NestjsxCrudResponseStrategy;
  let options: NestjsxCrudResponseOptions;

  beforeEach(() => {
    strategy = new NestjsxCrudResponseStrategy();
    options = new NestjsxCrudResponseOptions({});
  });

  it('parses a minimal @nestjsx/crud response', () => {
    const response = {
      data: [],
      count: 0,
      total: 0,
      page: 1,
      pageCount: 0
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('parses a full getMany envelope', () => {
    const response = {
      data: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ],
      count: 10,
      total: 48,
      page: 2,
      pageCount: 5
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(2);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.total).toBe(48);
  });

  it('computes from and to from page/count/total', () => {
    const response = {
      data: [{ id: 1 }],
      count: 10,
      total: 100,
      page: 3,
      pageCount: 10
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(30);
  });

  it('caps `to` at total on the last page', () => {
    const response = {
      data: [{ id: 1 }],
      count: 5,
      total: 35,
      page: 7,
      pageCount: 7
    };

    const collection = strategy.paginate(response, options);

    expect(collection.to).toBe(35);
  });

  it('leaves navigation links undefined (no links in the envelope)', () => {
    const response = {
      data: [],
      count: 0,
      total: 0,
      page: 1,
      pageCount: 1
    };

    const collection = strategy.paginate(response, options);

    expect(collection.firstPageUrl).toBeUndefined();
    expect(collection.prevPageUrl).toBeUndefined();
    expect(collection.nextPageUrl).toBeUndefined();
    expect(collection.lastPageUrl).toBeUndefined();
  });

  it('honours custom key paths via IPaginationConfig', () => {
    const customOptions = new NestjsxCrudResponseOptions({
      currentPage: 'meta.page',
      data: 'items',
      total: 'meta.total'
    });
    const response = {
      items: [{ id: 1 }],
      meta: { page: 4, total: 99 }
    };

    const collection = strategy.paginate(response, customOptions);

    expect(collection.data).toHaveSize(1);
    expect(collection.page).toBe(4);
    expect(collection.total).toBe(99);
  });

  it('normalizes the collection to a page-keyed id map', () => {
    const response = {
      data: [{ id: 7 }, { id: 9 }],
      count: 2,
      total: 2,
      page: 1,
      pageCount: 1
    };

    const collection = strategy.paginate(response, options);

    expect(collection.normalize()[1]).toEqual([7, 9]);
  });
});

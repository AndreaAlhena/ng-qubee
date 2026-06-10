/* eslint-disable @typescript-eslint/naming-convention */
import { SpringResponseOptions } from '../models/response-options';
import { SpringResponseStrategy } from './spring-response.strategy';

describe('SpringResponseStrategy', () => {
  let strategy: SpringResponseStrategy;
  let options: SpringResponseOptions;

  const fullResponse = {
    _embedded: {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]
    },
    _links: {
      first: { href: 'http://api.example.com/users?page=0&size=20' },
      prev: { href: 'http://api.example.com/users?page=0&size=20' },
      self: { href: 'http://api.example.com/users?page=1&size=20' },
      next: { href: 'http://api.example.com/users?page=2&size=20' },
      last: { href: 'http://api.example.com/users?page=4&size=20' }
    },
    page: {
      size: 20,
      totalElements: 100,
      totalPages: 5,
      number: 1
    }
  };

  beforeEach(() => {
    strategy = new SpringResponseStrategy();
    options = new SpringResponseOptions({});
  });

  it('parses a full HAL envelope', () => {
    const collection = strategy.paginate(fullResponse, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.perPage).toBe(20);
    expect(collection.lastPage).toBe(5);
    expect(collection.total).toBe(100);
  });

  it('converts the 0-indexed page.number to a 1-indexed page', () => {
    const collection = strategy.paginate(fullResponse, options);

    expect(collection.page).toBe(2);
  });

  it('reports page 1 for page.number 0', () => {
    const response = { ...fullResponse, page: { ...fullResponse.page, number: 0 } };

    const collection = strategy.paginate(response, options);

    expect(collection.page).toBe(1);
  });

  it('picks the first array under _embedded regardless of the rel name', () => {
    const response = {
      _embedded: { articles: [{ id: 7 }] },
      page: { size: 10, totalElements: 1, totalPages: 1, number: 0 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toEqual([{ id: 7 }]);
  });

  it('honours an explicit data path override', () => {
    const customOptions = new SpringResponseOptions({ data: '_embedded.users' });

    const collection = strategy.paginate(fullResponse, customOptions);

    expect(collection.data).toHaveSize(2);
  });

  it('returns an empty array when _embedded is missing (empty result set)', () => {
    const response = {
      _links: { self: { href: 'http://api.example.com/users' } },
      page: { size: 20, totalElements: 0, totalPages: 0, number: 0 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.data).toEqual([]);
    expect(collection.page).toBe(1);
  });

  it('reads navigation links from _links.*.href', () => {
    const collection = strategy.paginate(fullResponse, options);

    expect(collection.firstPageUrl).toBe('http://api.example.com/users?page=0&size=20');
    expect(collection.prevPageUrl).toBe('http://api.example.com/users?page=0&size=20');
    expect(collection.nextPageUrl).toBe('http://api.example.com/users?page=2&size=20');
    expect(collection.lastPageUrl).toBe('http://api.example.com/users?page=4&size=20');
  });

  it('leaves absent links undefined (first/last page)', () => {
    const response = {
      _embedded: { users: [{ id: 1 }] },
      _links: { self: { href: 'http://api.example.com/users' } },
      page: { size: 20, totalElements: 1, totalPages: 1, number: 0 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.prevPageUrl).toBeUndefined();
    expect(collection.nextPageUrl).toBeUndefined();
  });

  it('computes from and to from the 1-indexed page and size', () => {
    const collection = strategy.paginate(fullResponse, options);

    expect(collection.from).toBe(21);
    expect(collection.to).toBe(40);
  });

  it('caps `to` at total on the last page', () => {
    const response = {
      _embedded: { users: [{ id: 1 }] },
      page: { size: 20, totalElements: 85, totalPages: 5, number: 4 }
    };

    const collection = strategy.paginate(response, options);

    expect(collection.from).toBe(81);
    expect(collection.to).toBe(85);
  });

  it('normalizes the collection to a page-keyed id map', () => {
    const collection = strategy.paginate(fullResponse, options);

    expect(collection.normalize()[2]).toEqual([1, 2]);
  });
});

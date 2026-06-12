/* eslint-disable @typescript-eslint/naming-convention -- header-bag literals
   use WordPress' wire-format header names (X-WP-Total, X-WP-TotalPages, Link)
   verbatim */
import { ResponseOptions } from '../models/response-options';
import { WordpressResponseStrategy } from './wordpress-response.strategy';

describe('WordpressResponseStrategy', () => {
  let strategy: WordpressResponseStrategy;
  let options: ResponseOptions;

  const linkFor = (relations: { next?: number; prev?: number }): string => {
    const parts: string[] = [];

    if (relations.next !== undefined) {
      parts.push(`<https://example.com/wp-json/wp/v2/posts?page=${relations.next}>; rel="next"`);
    }

    if (relations.prev !== undefined) {
      parts.push(`<https://example.com/wp-json/wp/v2/posts?page=${relations.prev}>; rel="prev"`);
    }

    return parts.join(', ');
  };

  beforeEach(() => {
    strategy = new WordpressResponseStrategy();
    options = new ResponseOptions({});
  });

  it('should parse a bare-array body with no headers', () => {
    const body = [{ id: 1 }, { id: 2 }] as unknown as Record<string, unknown>;

    const collection = strategy.paginate(body, options);

    expect(collection.data).toHaveSize(2);
    expect(collection.page).toBe(1);
    expect(collection.total).toBeUndefined();
    expect(collection.lastPage).toBeUndefined();
  });

  it('should read totals from the X-WP headers', () => {
    const body = [{ id: 1 }] as unknown as Record<string, unknown>;
    const headers = { 'X-WP-Total': '48', 'X-WP-TotalPages': '5' };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.total).toBe(48);
    expect(collection.lastPage).toBe(5);
  });

  it('should parse a typical first-page response', () => {
    const body = [
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }
    ] as unknown as Record<string, unknown>;
    const headers = {
      'Link': linkFor({ next: 2 }),
      'X-WP-Total': '48',
      'X-WP-TotalPages': '5'
    };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.page).toBe(1);
    expect(collection.perPage).toBe(10);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(10);
    expect(collection.nextPageUrl).toBe('https://example.com/wp-json/wp/v2/posts?page=2');
    expect(collection.prevPageUrl).toBeUndefined();
  });

  it('should derive the page from the prev link on a middle page', () => {
    const body = [{ id: 21 }, { id: 22 }] as unknown as Record<string, unknown>;
    const headers = {
      'Link': linkFor({ next: 4, prev: 2 }),
      'X-WP-Total': '48',
      'X-WP-TotalPages': '5'
    };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.page).toBe(3);
    expect(collection.nextPageUrl).toContain('page=4');
    expect(collection.prevPageUrl).toContain('page=2');
  });

  it('should count back from the total on the last page', () => {
    const body = [
      { id: 41 }, { id: 42 }, { id: 43 }, { id: 44 },
      { id: 45 }, { id: 46 }, { id: 47 }, { id: 48 }
    ] as unknown as Record<string, unknown>;
    const headers = {
      'Link': linkFor({ prev: 4 }),
      'X-WP-Total': '48',
      'X-WP-TotalPages': '5'
    };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.page).toBe(5);
    expect(collection.perPage).toBeUndefined();
    expect(collection.from).toBe(41);
    expect(collection.to).toBe(48);
    expect(collection.nextPageUrl).toBeUndefined();
  });

  it('should cover the whole set on a single-page response', () => {
    const body = [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as Record<string, unknown>;
    const headers = { 'X-WP-Total': '3', 'X-WP-TotalPages': '1' };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.page).toBe(1);
    expect(collection.from).toBe(1);
    expect(collection.to).toBe(3);
  });

  it('should tolerate extra Link relations and any ordering', () => {
    const body = [{ id: 11 }] as unknown as Record<string, unknown>;
    const headers = {
      'Link': '<https://example.com/wp-json/>; rel="https://api.w.org/", <https://example.com/wp-json/wp/v2/posts?page=1>; rel="prev", <https://example.com/wp-json/wp/v2/posts?page=3>; rel="next"',
      'X-WP-Total': '48',
      'X-WP-TotalPages': '5'
    };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.page).toBe(2);
    expect(collection.prevPageUrl).toContain('page=1');
    expect(collection.nextPageUrl).toContain('page=3');
  });

  it('should read headers from a bag exposing a get() accessor', () => {
    const body = [{ id: 1 }] as unknown as Record<string, unknown>;
    const headers = {
      get: (name: string): string | null => {
        const map: Record<string, string> = { 'X-WP-Total': '7', 'X-WP-TotalPages': '1' };

        return map[name] ?? null;
      }
    };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.total).toBe(7);
    expect(collection.lastPage).toBe(1);
  });

  it('should read the array from an envelope at options.data when not a bare array', () => {
    const custom = new ResponseOptions({ data: 'items' });
    const body = { items: [{ id: 1 }, { id: 2 }] };

    const collection = strategy.paginate(body, custom);

    expect(collection.data).toHaveSize(2);
  });

  it('should ignore unparseable header values', () => {
    const body = [{ id: 1 }] as unknown as Record<string, unknown>;
    const headers = { 'X-WP-Total': 'lots', 'X-WP-TotalPages': '' };

    const collection = strategy.paginate(body, options, headers);

    expect(collection.total).toBeUndefined();
    expect(collection.lastPage).toBeUndefined();
  });
});

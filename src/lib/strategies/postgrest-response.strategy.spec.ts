import { ResponseOptions } from '../models/response-options';
import { PostgrestResponseStrategy } from './postgrest-response.strategy';

describe('PostgrestResponseStrategy', () => {
  let strategy: PostgrestResponseStrategy;
  let options: ResponseOptions;

  beforeEach(() => {
    strategy = new PostgrestResponseStrategy();
    options = new ResponseOptions({});
  });

  // Body shape — PostgREST returns a bare array
  describe('body shape', () => {
    it('should accept a bare array as the response body', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collection = strategy.paginate([{ id: 1 }, { id: 2 }] as any, options);

      expect(collection.data).toHaveSize(2);
    });

    it('should accept an envelope with the array at options.data', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collection = strategy.paginate({ data: [{ id: 1 }] } as any, options);

      expect(collection.data).toHaveSize(1);
    });
  });

  // Content-Range header parsing — the bulk of the strategy's job
  describe('Content-Range parsing', () => {
    it('should derive from/to/total/perPage/page/lastPage from 0-9/50', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': '0-9/50' }
      );

      // 1-indexed conversion: from=1, to=10; perPage=10
      expect(collection.from).toBe(1);
      expect(collection.to).toBe(10);
      expect(collection.total).toBe(50);
      expect(collection.perPage).toBe(10);
      expect(collection.page).toBe(1);
      expect(collection.lastPage).toBe(5);
    });

    it('should derive page 3 from 20-29/50', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': '20-29/50' }
      );

      expect(collection.page).toBe(3);
      expect(collection.lastPage).toBe(5);
    });

    it('should leave total and lastPage undefined when total is "*"', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': '0-9/*' }
      );

      expect(collection.total).toBeUndefined();
      expect(collection.lastPage).toBeUndefined();
      expect(collection.perPage).toBe(10);
      expect(collection.page).toBe(1);
    });

    it('should tolerate a missing Content-Range header', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collection = strategy.paginate([{ id: 1 }] as any, options);

      expect(collection.from).toBeUndefined();
      expect(collection.to).toBeUndefined();
      expect(collection.total).toBeUndefined();
      expect(collection.perPage).toBeUndefined();
      expect(collection.lastPage).toBeUndefined();
      expect(collection.page).toBe(1);
    });

    it('should tolerate a malformed Content-Range header', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': 'garbage' }
      );

      expect(collection.from).toBeUndefined();
      expect(collection.total).toBeUndefined();
    });

    it('should accept HttpHeaders-like bags with a .get() method', () => {
      const headers = { get(name: string): string | null {
        return name === 'Content-Range' ? '0-4/25' : null;
      } };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collection = strategy.paginate([{ id: 1 }] as any, options, headers);

      expect(collection.perPage).toBe(5);
      expect(collection.total).toBe(25);
      expect(collection.lastPage).toBe(5);
    });

    it('should convert PostgREST 0-indexed bounds to 1-indexed from/to', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': '10-19/100' }
      );

      // PostgREST: from=10, to=19 → library: from=11, to=20
      expect(collection.from).toBe(11);
      expect(collection.to).toBe(20);
      expect(collection.page).toBe(2);
      expect(collection.lastPage).toBe(10);
    });
  });

  // URL fields — PostgREST doesn't emit page URLs, these stay undefined
  describe('page URLs', () => {
    it('should leave prevPageUrl / nextPageUrl / firstPageUrl / lastPageUrl undefined', () => {
      const collection = strategy.paginate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: 1 }] as any,
        options,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'Content-Range': '0-9/50' }
      );

      expect(collection.prevPageUrl).toBeUndefined();
      expect(collection.nextPageUrl).toBeUndefined();
      expect(collection.firstPageUrl).toBeUndefined();
      expect(collection.lastPageUrl).toBeUndefined();
    });
  });
});

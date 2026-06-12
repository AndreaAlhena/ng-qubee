import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { WordpressRequestStrategy } from './wordpress-request.strategy';

describe('WordpressRequestStrategy', () => {
  let strategy: WordpressRequestStrategy;
  let options: QueryBuilderOptions;

  const baseState: IQueryBuilderState = {
    baseUrl: '',
    embedded: {},
    fields: {},
    filters: {},
    includes: [],
    isLastPageKnown: false,
    lastPage: 1,
    limit: 15,
    operatorFilters: [],
    page: 1,
    resource: 'posts',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new WordpressRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/posts?page=1&per_page=15');
  });

  it('should prepend the base URL when set', () => {
    const state = { ...baseState, baseUrl: 'https://example.com/wp-json/wp/v2' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://example.com/wp-json/wp/v2/posts?page=1&per_page=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as a bare collection param', () => {
      const state = { ...baseState, filters: { status: ['publish'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=publish');
    });

    it('should fold a multi-value filter to a CSV', () => {
      const state = { ...baseState, filters: { categories: [2, 3] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('categories=2,3');
    });

    it('should emit multiple filters as separate params', () => {
      const state = {
        ...baseState,
        filters: { author: [1], status: ['publish'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('author=1');
      expect(uri).toContain('status=publish');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('status');
    });
  });

  describe('sorts', () => {
    it('should emit orderby and order from a sort rule', () => {
      const state = { ...baseState, sorts: [{ field: 'date', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('orderby=date&order=desc');
    });

    it('should emit ascending order as asc', () => {
      const state = { ...baseState, sorts: [{ field: 'title', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('orderby=title&order=asc');
    });

    it('should emit only the first sort rule (single orderby on the wire)', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'date', order: SortEnum.DESC },
          { field: 'title', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('orderby=date&order=desc');
      expect(uri).not.toContain('orderby=title');
    });
  });

  describe('select', () => {
    it('should emit the flat select array as a _fields CSV', () => {
      const state = { ...baseState, select: ['id', 'title'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_fields=id,title');
    });
  });

  describe('includes', () => {
    it('should emit includes as an _embed CSV', () => {
      const state = { ...baseState, includes: ['author', 'wp:term'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_embed=author,wp:term');
    });
  });

  describe('search', () => {
    it('should emit the search term', () => {
      const state = { ...baseState, search: 'hello world' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('search=hello world');
    });

    it('should omit the search param when no term is set', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('search=');
    });
  });

  describe('limit validation', () => {
    it('should accept a positive integer', () => {
      expect(() => strategy.validateLimit(100)).not.toThrow();
    });

    it('should reject zero, negatives, and non-integers', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(-1)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(1.5)).toThrowError(InvalidLimitError);
    });
  });

  describe('capabilities', () => {
    it('should declare filters, includes, search, select, and sort', () => {
      expect(strategy.capabilities).toEqual({
        embedded: false,
        fields: false,
        filters: true,
        includes: true,
        operatorFilters: false,
        search: true,
        select: true,
        sort: true
      });
    });
  });
});

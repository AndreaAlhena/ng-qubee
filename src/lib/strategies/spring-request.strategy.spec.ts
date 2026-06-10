import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { SpringRequestStrategy } from './spring-request.strategy';

describe('SpringRequestStrategy', () => {
  let strategy: SpringRequestStrategy;
  let options: QueryBuilderOptions;

  const baseState: IQueryBuilderState = {
    baseUrl: '',
    fields: {},
    filters: {},
    includes: [],
    isLastPageKnown: false,
    lastPage: 1,
    limit: 15,
    operatorFilters: [],
    page: 1,
    resource: 'items',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new SpringRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?page=0&size=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('capabilities', () => {
    it('should declare sort-only capabilities', () => {
      expect(strategy.capabilities).toEqual({
        fields: false,
        filters: false,
        includes: false,
        operatorFilters: false,
        search: false,
        select: false,
        sort: true
      });
    });
  });

  describe('pagination (0-indexed)', () => {
    it('should emit page=0 for the first library page', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).toContain('page=0');
    });

    it('should emit page=N-1 for library page N', () => {
      const state = { ...baseState, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page=2');
    });

    it('should emit the limit as size', () => {
      const state = { ...baseState, limit: 25 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('size=25');
    });
  });

  describe('sorting', () => {
    it('should emit a single ASC sort as sort=field,asc', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name,asc');
    });

    it('should emit a DESC sort as sort=field,desc', () => {
      const state = { ...baseState, sorts: [{ field: 'createdAt', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=createdAt,desc');
    });

    it('should repeat the sort param, one occurrence per rule', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'name', order: SortEnum.ASC },
          { field: 'age', order: SortEnum.DESC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name,asc&sort=age,desc');
    });

    it('should omit sort when no rules are set', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('sort=');
    });
  });

  describe('base URL', () => {
    it('should prepend the base URL when set', () => {
      const state = { ...baseState, baseUrl: 'https://api.example.com' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/items?');
    });
  });

  describe('custom key names', () => {
    it('should use custom page and sort keys', () => {
      const customOptions = new QueryBuilderOptions({ page: 'p', sort: 'order' });
      const state = { ...baseState, page: 2, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('p=1');
      expect(uri).toContain('order=name,asc');
    });

    it('should keep size hardcoded regardless of options.limit', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'lim' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('size=15');
      expect(uri).not.toContain('lim=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete Spring Data REST query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        limit: 20,
        page: 2,
        resource: 'users',
        sorts: [
          { field: 'lastName', order: SortEnum.ASC },
          { field: 'createdAt', order: SortEnum.DESC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe('https://api.example.com/users?sort=lastName,asc&sort=createdAt,desc&page=1&size=20');
    });
  });

  describe('validateLimit', () => {
    it('should accept 1', () => {
      expect(() => strategy.validateLimit(1)).not.toThrow();
    });

    it('should throw InvalidLimitError for -1', () => {
      expect(() => strategy.validateLimit(-1)).toThrowError(InvalidLimitError);
    });

    it('should throw InvalidLimitError for 0', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
    });

    it('should throw InvalidLimitError for a decimal', () => {
      expect(() => strategy.validateLimit(15.5)).toThrowError(InvalidLimitError);
    });
  });
});

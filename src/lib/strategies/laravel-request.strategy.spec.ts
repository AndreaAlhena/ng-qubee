import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { LaravelRequestStrategy } from './laravel-request.strategy';

describe('LaravelRequestStrategy', () => {
  let strategy: LaravelRequestStrategy;
  let options: QueryBuilderOptions;

  const baseState: IQueryBuilderState = {
    baseUrl: '',
    fields: {},
    filters: {},
    includes: [],
    limit: 15,
    operatorFilters: [],
    page: 1,
    resource: 'users',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new LaravelRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a pagination-only URI', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE calling the url() / get() methods'
    );
  });

  it('should generate a URI with custom limit and page', () => {
    const state = { ...baseState, limit: 25, page: 3 };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=25&page=3');
  });

  it('should prepend base URL when set', () => {
    const state = { ...baseState, baseUrl: 'https://api.example.com' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://api.example.com/users?limit=15&page=1');
  });

  it('should use custom limit and page key names', () => {
    const customOptions = new QueryBuilderOptions({ limit: 'per_page', page: 'pg' });
    const uri = strategy.buildUri(baseState, customOptions);

    expect(uri).toBe('/users?per_page=15&pg=1');
  });

  it('should ignore filters in state', () => {
    const state = { ...baseState, filters: { status: ['active'] } };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should ignore sorts in state', () => {
    const state = {
      ...baseState,
      sorts: [{ field: 'name', order: SortEnum.ASC }]
    };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should ignore fields in state', () => {
    const state = { ...baseState, fields: { users: ['id', 'email'] } };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should ignore includes in state', () => {
    const state = { ...baseState, includes: ['profile', 'posts'] };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should ignore search in state', () => {
    const state = { ...baseState, search: 'john' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should ignore select in state', () => {
    const state = { ...baseState, select: ['id', 'name'] };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  // validateLimit (Laravel does not recognize -1)
  describe('validateLimit', () => {
    it('should accept 1', () => {
      expect(() => strategy.validateLimit(1)).not.toThrow();
    });

    it('should accept a large positive integer', () => {
      expect(() => strategy.validateLimit(1_000_000)).not.toThrow();
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

    it('should throw InvalidLimitError for NaN', () => {
      expect(() => strategy.validateLimit(NaN)).toThrowError(InvalidLimitError);
    });

    it('should throw InvalidLimitError for Infinity', () => {
      expect(() => strategy.validateLimit(Infinity)).toThrowError(InvalidLimitError);
    });

    it('should not mention the -1 sentinel in the error message', () => {
      expect(() => strategy.validateLimit(0)).not.toThrowError(/-1 to fetch all items/);
    });
  });
});

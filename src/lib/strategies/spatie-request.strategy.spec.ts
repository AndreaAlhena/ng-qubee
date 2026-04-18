import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { SpatieRequestStrategy } from './spatie-request.strategy';

describe('SpatieRequestStrategy', () => {
  let strategy: SpatieRequestStrategy;
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
    strategy = new SpatieRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource, limit, and page', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/users?limit=15&page=1');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  // Includes
  describe('includes', () => {
    it('should generate URI with includes', () => {
      const state = { ...baseState, includes: ['model1', 'model2', 'model3'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe('/users?include=model1,model2,model3&limit=15&page=1');
    });
  });

  // Fields
  describe('fields', () => {
    it('should generate URI with fields (single model)', () => {
      const state = {
        ...baseState,
        fields: { users: ['email', 'name'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields[users]=email,name');
    });

    it('should generate URI with fields (multiple models with includes)', () => {
      const state = {
        ...baseState,
        fields: { users: ['email', 'name'], settings: ['field1', 'field2'] },
        includes: ['settings']
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields[users]=email,name');
      expect(uri).toContain('fields[settings]=field1,field2');
    });

    it('should throw UnselectableModelError if field model is not resource or in includes', () => {
      const state = {
        ...baseState,
        fields: { users: ['email'], settings: ['field1'] }
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(UnselectableModelError);
    });
  });

  // Filters
  describe('filters', () => {
    it('should generate URI with a single filter', () => {
      const state = { ...baseState, filters: { id: [1, 2, 3] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[id]=1,2,3');
    });

    it('should generate URI with multiple filters', () => {
      const state = {
        ...baseState,
        filters: { id: [1, 2, 3], name: ['doe'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[id]=1,2,3');
      expect(uri).toContain('filter[name]=doe');
    });

    it('should generate URI with boolean filter value', () => {
      const state = { ...baseState, filters: { isActive: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[isActive]=true');
    });
  });

  // Sorts
  describe('sorts', () => {
    it('should generate URI with ASC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'f', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=f');
    });

    it('should generate URI with DESC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'f', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-f');
    });

    it('should generate URI with mixed sorts', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'f1', order: SortEnum.DESC },
          { field: 'f2', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-f1,f2');
    });
  });

  // Pagination
  describe('pagination', () => {
    it('should include custom limit and page', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('limit=25');
      expect(uri).toContain('page=3');
    });
  });

  // Base URL
  describe('base URL', () => {
    it('should prepend base URL when set', () => {
      const state = { ...baseState, baseUrl: 'https://api.example.com' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/users?');
    });
  });

  // Custom key names
  describe('custom key names', () => {
    it('should use custom fields key', () => {
      const customOptions = new QueryBuilderOptions({ fields: 'fld' });
      const state = {
        ...baseState,
        fields: { users: ['email', 'name'] }
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('fld[users]=email,name');
    });

    it('should use custom filter key', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'flt' });
      const state = { ...baseState, filters: { id: [1, 2, 3] } };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('flt[id]=1,2,3');
    });

    it('should use custom includes key', () => {
      const customOptions = new QueryBuilderOptions({ includes: 'inc' });
      const state = { ...baseState, includes: ['model1', 'model2'] };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('inc=model1,model2');
    });

    it('should use custom limit key', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'lmt' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('lmt=15');
    });

    it('should use custom page key', () => {
      const customOptions = new QueryBuilderOptions({ page: 'p' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('p=1');
    });

    it('should use custom sort key', () => {
      const customOptions = new QueryBuilderOptions({ sort: 'srt' });
      const state = {
        ...baseState,
        sorts: [{ field: 'f', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('srt=f');
    });
  });

  // Combined query
  describe('combined queries', () => {
    it('should build a complete Spatie query URI', () => {
      const state: IQueryBuilderState = {
        baseUrl: 'https://api.example.com',
        fields: { users: ['id', 'email'] },
        filters: { status: ['active'] },
        includes: [],
        limit: 10,
        operatorFilters: [],
        page: 2,
        resource: 'users',
        search: '',
        select: [],
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/users?');
      expect(uri).toContain('fields[users]=id,email');
      expect(uri).toContain('filter[status]=active');
      expect(uri).toContain('sort=name');
      expect(uri).toContain('limit=10');
      expect(uri).toContain('page=2');
    });
  });

  // validateLimit (Spatie does not recognize -1)
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

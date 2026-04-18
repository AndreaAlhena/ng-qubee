import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { NestjsRequestStrategy } from './nestjs-request.strategy';

describe('NestjsRequestStrategy', () => {
  let strategy: NestjsRequestStrategy;
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
    strategy = new NestjsRequestStrategy();
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

  // Simple filters
  describe('simple filters', () => {
    it('should generate URI with a single simple filter', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.status=active');
    });

    it('should generate URI with multiple filter values', () => {
      const state = { ...baseState, filters: { id: [1, 2, 3] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.id=1,2,3');
    });

    it('should generate URI with multiple filters', () => {
      const state = {
        ...baseState,
        filters: {
          status: ['active'],
          role: ['admin', 'user']
        }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.status=active');
      expect(uri).toContain('filter.role=admin,user');
    });

    it('should generate URI with boolean filter value', () => {
      const state = { ...baseState, filters: { isActive: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.isActive=true');
    });
  });

  // Operator filters
  describe('operator filters', () => {
    it('should generate URI with $eq operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.EQ, values: ['active'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.status=$eq:active');
    });

    it('should generate URI with $gte operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'age', operator: FilterOperatorEnum.GTE, values: [18] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.age=$gte:18');
    });

    it('should generate URI with $in operator (multiple values)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.IN, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.id=$in:1,2,3');
    });

    it('should generate URI with $btw operator (range values)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.price=$btw:10,100');
    });

    it('should generate URI with $ilike operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.ILIKE, values: ['john'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.name=$ilike:john');
    });

    it('should generate URI with $null operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.deletedAt=$null:true');
    });

    it('should generate URI with $sw operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'email', operator: FilterOperatorEnum.SW, values: ['admin'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.email=$sw:admin');
    });

    it('should generate URI with $contains operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tags', operator: FilterOperatorEnum.CONTAINS, values: ['angular'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.tags=$contains:angular');
    });

    it('should generate URI with $not operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['deleted'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.status=$not:deleted');
    });

    it('should generate URI with $gt operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'count', operator: FilterOperatorEnum.GT, values: [5] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.count=$gt:5');
    });

    it('should generate URI with $lt operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'count', operator: FilterOperatorEnum.LT, values: [100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.count=$lt:100');
    });

    it('should generate URI with $lte operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'score', operator: FilterOperatorEnum.LTE, values: [50] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.score=$lte:50');
    });

    it('should generate URI with multiple operator filters', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'age', operator: FilterOperatorEnum.GTE, values: [18] },
          { field: 'age', operator: FilterOperatorEnum.LTE, values: [65] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter.age=$gte:18');
      expect(uri).toContain('filter.age=$lte:65');
    });
  });

  // Sorts
  describe('sorts', () => {
    it('should generate URI with ASC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sortBy=name:ASC');
    });

    it('should generate URI with DESC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sortBy=created_at:DESC');
    });

    it('should generate URI with multiple sorts', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'name', order: SortEnum.ASC },
          { field: 'created_at', order: SortEnum.DESC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sortBy=name:ASC,created_at:DESC');
    });
  });

  // Select
  describe('select', () => {
    it('should generate URI with select fields', () => {
      const state = { ...baseState, select: ['id', 'name', 'email'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('select=id,name,email');
    });

    it('should not include select when empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('select=');
    });
  });

  // Search
  describe('search', () => {
    it('should generate URI with search term', () => {
      const state = { ...baseState, search: 'john' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('search=john');
    });

    it('should not include search when empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('search=');
    });
  });

  // Pagination
  describe('pagination', () => {
    it('should include limit and page', () => {
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

  // Combined query
  describe('combined queries', () => {
    it('should build a complete NestJS query URI', () => {
      const state: IQueryBuilderState = {
        baseUrl: 'https://api.example.com',
        fields: {},
        filters: { status: ['active'] },
        includes: [],
        limit: 10,
        operatorFilters: [
          { field: 'age', operator: FilterOperatorEnum.GTE, values: [18] }
        ],
        page: 2,
        resource: 'users',
        search: 'john',
        select: ['id', 'name', 'email'],
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/users?');
      expect(uri).toContain('filter.status=active');
      expect(uri).toContain('filter.age=$gte:18');
      expect(uri).toContain('sortBy=name:ASC');
      expect(uri).toContain('select=id,name,email');
      expect(uri).toContain('search=john');
      expect(uri).toContain('limit=10');
      expect(uri).toContain('page=2');
    });
  });

  // Custom key names
  describe('custom key names', () => {
    it('should use custom filter key', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'f' });
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('f.status=active');
    });

    it('should use custom sortBy key', () => {
      const customOptions = new QueryBuilderOptions({ sortBy: 'order' });
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('order=name:ASC');
    });

    it('should use custom select key', () => {
      const customOptions = new QueryBuilderOptions({ select: 'columns' });
      const state = { ...baseState, select: ['id', 'name'] };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('columns=id,name');
    });

    it('should use custom search key', () => {
      const customOptions = new QueryBuilderOptions({ search: 'q' });
      const state = { ...baseState, search: 'john' };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('q=john');
    });
  });

  // validateLimit (nestjs-paginate accepts -1 as a "fetch all" sentinel)
  describe('validateLimit', () => {
    it('should accept -1 (fetch all)', () => {
      expect(() => strategy.validateLimit(-1)).not.toThrow();
    });

    it('should accept 1', () => {
      expect(() => strategy.validateLimit(1)).not.toThrow();
    });

    it('should accept a large positive integer', () => {
      expect(() => strategy.validateLimit(1_000_000)).not.toThrow();
    });

    it('should throw InvalidLimitError for 0', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
    });

    it('should throw InvalidLimitError for -2', () => {
      expect(() => strategy.validateLimit(-2)).toThrowError(InvalidLimitError);
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

    it('should mention the -1 sentinel in the error message', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(/-1 to fetch all items/);
    });
  });
});

import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { PostgrestRequestStrategy } from './postgrest-request.strategy';

describe('PostgrestRequestStrategy', () => {
  let strategy: PostgrestRequestStrategy;
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
    resource: 'users',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new PostgrestRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and limit', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/users?limit=15');
  });

  it('should omit offset on page 1', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).not.toContain('offset=');
  });

  it('should include offset derived from page and limit', () => {
    const state = { ...baseState, limit: 10, page: 3 };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('/users?limit=10&offset=20');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  it('should prepend baseUrl when set', () => {
    const state = { ...baseState, baseUrl: 'https://api.example.com' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://api.example.com/users?limit=15');
  });

  // Filters
  describe('filters', () => {
    it('should emit single-value filter as col=eq.val', () => {
      const state = { ...baseState, filters: { id: [5] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id=eq.5');
    });

    it('should emit multi-value filter as col=in.(v1,v2,v3)', () => {
      const state = { ...baseState, filters: { id: [1, 2, 3] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id=in.(1,2,3)');
    });

    it('should emit multiple filters as separate params', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], role: ['admin'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=eq.active');
      expect(uri).toContain('role=eq.admin');
    });

    it('should emit boolean filter value as col=eq.true', () => {
      const state = { ...baseState, filters: { isActive: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('isActive=eq.true');
    });

    it('should skip filter keys with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('status=');
    });
  });

  // Operator filters — the full PostgREST operator mapping
  describe('operator filters', () => {
    it('should emit EQ as col=eq.val', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.EQ, values: ['active'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=eq.active');
    });

    it('should emit GT / GTE / LT / LTE with direct prefixes', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'a', operator: FilterOperatorEnum.GT, values: [1] },
          { field: 'b', operator: FilterOperatorEnum.GTE, values: [2] },
          { field: 'c', operator: FilterOperatorEnum.LT, values: [3] },
          { field: 'd', operator: FilterOperatorEnum.LTE, values: [4] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('a=gt.1');
      expect(uri).toContain('b=gte.2');
      expect(uri).toContain('c=lt.3');
      expect(uri).toContain('d=lte.4');
    });

    it('should emit ILIKE as col=ilike.pattern', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.ILIKE, values: ['%john%'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('name=ilike.%john%');
    });

    it('should emit IN as col=in.(v1,v2,v3)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.IN, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id=in.(1,2,3)');
    });

    it('should emit NOT for a single value as col=not.eq.val', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['deleted'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=not.eq.deleted');
    });

    it('should emit NOT for multi-value as col=not.in.(v1,v2)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.NOT, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id=not.in.(1,2,3)');
    });

    it('should emit NULL(true) as col=is.null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt=is.null');
    });

    it('should emit NULL(false) as col=is.not.null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt=is.not.null');
    });

    it('should throw InvalidFilterOperatorValueError for NULL with non-boolean value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: ['true' as unknown as boolean] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should throw InvalidFilterOperatorValueError for NULL with wrong arity', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true, false] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit BTW as two params col=gte.min&col=lte.max', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price=gte.10');
      expect(uri).toContain('price=lte.100');
    });

    it('should throw InvalidFilterOperatorValueError for BTW with wrong arity', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit SW as col=like.val*', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'email', operator: FilterOperatorEnum.SW, values: ['admin'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('email=like.admin*');
    });

    it('should emit CONTAINS as col=ilike.%val%', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.CONTAINS, values: ['john'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('name=ilike.%john%');
    });

    it('should emit FTS / PLFTS / PHFTS / WFTS for full-text search', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'd', operator: FilterOperatorEnum.FTS, values: ['fat&rat'] },
          { field: 'e', operator: FilterOperatorEnum.PLFTS, values: ['fat rat'] },
          { field: 'f', operator: FilterOperatorEnum.PHFTS, values: ['fat rat'] },
          { field: 'g', operator: FilterOperatorEnum.WFTS, values: ['fat -rat'] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('d=fts.fat&rat');
      expect(uri).toContain('e=plfts.fat rat');
      expect(uri).toContain('f=phfts.fat rat');
      expect(uri).toContain('g=wfts.fat -rat');
    });

    it('should emit multiple operator filters together', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'age', operator: FilterOperatorEnum.GTE, values: [18] },
          { field: 'age', operator: FilterOperatorEnum.LTE, values: [65] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('age=gte.18');
      expect(uri).toContain('age=lte.65');
    });
  });

  // Order
  describe('order', () => {
    it('should emit ASC sort as col.asc', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('order=name.asc');
    });

    it('should emit DESC sort as col.desc', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('order=created_at.desc');
    });

    it('should join multiple sorts with commas', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'created_at', order: SortEnum.DESC },
          { field: 'name', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('order=created_at.desc,name.asc');
    });

    it('should always use the hard-coded `order` key (not options.sort)', () => {
      const customOptions = new QueryBuilderOptions({ sort: 'sortBy' });
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('order=name.asc');
      expect(uri).not.toContain('sortBy=');
    });
  });

  // Select
  describe('select', () => {
    it('should emit a flat select as select=col1,col2', () => {
      const state = { ...baseState, select: ['id', 'name', 'email'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('select=id,name,email');
    });

    it('should skip select when empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('select=');
    });
  });

  // Custom option keys (those that apply to PostgREST)
  describe('custom key names', () => {
    it('should use custom limit key', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'lmt' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('lmt=15');
    });

    it('should use custom select key', () => {
      const customOptions = new QueryBuilderOptions({ select: 'cols' });
      const state = { ...baseState, select: ['id', 'name'] };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('cols=id,name');
    });
  });

  // Combined query
  describe('combined queries', () => {
    it('should build a complete PostgREST query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { status: ['active'], role: ['admin', 'editor'] },
        limit: 10,
        page: 2,
        select: ['id', 'name', 'email'],
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/users?');
      expect(uri).toContain('status=eq.active');
      expect(uri).toContain('role=in.(admin,editor)');
      expect(uri).toContain('order=created_at.desc');
      expect(uri).toContain('select=id,name,email');
      expect(uri).toContain('limit=10');
      expect(uri).toContain('offset=10');
    });
  });

  // validateLimit
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

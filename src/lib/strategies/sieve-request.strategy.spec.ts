import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { SieveRequestStrategy } from './sieve-request.strategy';

describe('SieveRequestStrategy', () => {
  let strategy: SieveRequestStrategy;
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
    strategy = new SieveRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?page=1&pageSize=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as field==value', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filters=status==active');
    });

    it('should emit a multi-value filter as a value-level pipe OR', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filters=status==active|pending');
    });

    it('should AND-join multiple filters with a comma in one filters param', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filters=status==active,category==tech');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('filters=');
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators with Sieve symbols', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'age', operator: FilterOperatorEnum.EQ, values: [18] },
          { field: 'price', operator: FilterOperatorEnum.GT, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.LT, values: [100] },
          { field: 'price', operator: FilterOperatorEnum.LTE, values: [100] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('age==18');
      expect(uri).toContain('price>10');
      expect(uri).toContain('price>=10');
      expect(uri).toContain('price<100');
      expect(uri).toContain('price<=100');
    });

    it('should emit CONTAINS as field@=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title@=foo');
    });

    it('should emit ILIKE as field@=*value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['FOO'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title@=*FOO');
    });

    it('should emit SW as field_=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title_=Intro');
    });

    it('should emit IN as a value-level pipe OR', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b', 'c'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('tag==a|b|c');
    });

    it('should expand BTW to two AND-ed terms', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price>=10,price<=100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NOT with a single value as field!=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status!=archived');
    });

    it('should expand NOT with multiple values to AND-ed != terms', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status!=archived,status!=draft');
    });

    it('should emit NULL=true as field==null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt==null');
    });

    it('should emit NULL=false as field!=null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt!=null');
    });

    it('should throw InvalidFilterOperatorValueError when NULL receives a non-boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should throw UnsupportedFilterOperatorError for FTS-family operators', () => {
      [FilterOperatorEnum.FTS, FilterOperatorEnum.PHFTS, FilterOperatorEnum.PLFTS, FilterOperatorEnum.WFTS].forEach(op => {
        const state = {
          ...baseState,
          operatorFilters: [{ field: 'body', operator: op, values: ['keyword'] }]
        };

        expect(() => strategy.buildUri(state, options)).toThrowError(UnsupportedFilterOperatorError);
      });
    });

    it('should AND-join simple and operator filters in one filters param', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.GTE, values: [100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filters=status==active,price>=100');
    });
  });

  describe('sorting', () => {
    it('should emit an ASC sort with no prefix', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sorts=name');
    });

    it('should emit a DESC sort with a leading minus', () => {
      const state = { ...baseState, sorts: [{ field: 'createdDate', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sorts=-createdDate');
    });

    it('should emit mixed sorts joined by comma', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'likeCount', order: SortEnum.ASC },
          { field: 'createdDate', order: SortEnum.DESC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sorts=likeCount,-createdDate');
    });
  });

  describe('pagination', () => {
    it('should emit page and pageSize with the custom values', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page=3');
      expect(uri).toContain('pageSize=25');
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
    it('should use a custom page key', () => {
      const customOptions = new QueryBuilderOptions({ page: 'p' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('p=1');
    });

    it('should keep filters, sorts, and pageSize hardcoded regardless of options', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'flt', limit: 'lim', sort: 'srt' });
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('filters=status==active');
      expect(uri).toContain('sorts=name');
      expect(uri).toContain('pageSize=15');
      expect(uri).not.toContain('flt=');
      expect(uri).not.toContain('srt=');
      expect(uri).not.toContain('lim=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete Sieve query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { status: ['published'] },
        limit: 10,
        operatorFilters: [
          { field: 'likeCount', operator: FilterOperatorEnum.GTE, values: [100] },
          { field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['hello'] }
        ],
        page: 2,
        resource: 'posts',
        sorts: [{ field: 'createdDate', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe(
        'https://api.example.com/posts?filters=status==published,likeCount>=100,title@=*hello&sorts=-createdDate&page=2&pageSize=10'
      );
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

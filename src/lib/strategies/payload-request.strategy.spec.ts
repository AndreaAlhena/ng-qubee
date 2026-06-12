import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { PayloadRequestStrategy } from './payload-request.strategy';

describe('PayloadRequestStrategy', () => {
  let strategy: PayloadRequestStrategy;
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
    strategy = new PayloadRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/posts?page=1&limit=15');
  });

  it('should prepend the base URL when set', () => {
    const state = { ...baseState, baseUrl: 'https://cms.example.com/api' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://cms.example.com/api/posts?page=1&limit=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as where[field][equals]', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[status][equals]=active');
    });

    it('should fold a multi-value filter to where[field][in] CSV', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[status][in]=active,pending');
    });

    it('should merge multiple filters into one where block', () => {
      const state = {
        ...baseState,
        filters: { category: ['tech'], status: ['active'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[category][equals]=tech&where[status][equals]=active');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('where');
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators with Payload names', () => {
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

      expect(uri).toContain('where[age][equals]=18');
      expect(uri).toContain('where[price][greater_than]=10');
      expect(uri).toContain('where[price][greater_than_equal]=10');
      expect(uri).toContain('where[price][less_than]=100');
      expect(uri).toContain('where[price][less_than_equal]=100');
    });

    it('should emit CONTAINS as contains and ILIKE as like', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] },
          { field: 'body', operator: FilterOperatorEnum.ILIKE, values: ['bar'] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[title][contains]=foo');
      expect(uri).toContain('where[body][like]=bar');
    });

    it('should emit IN as a CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.IN, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[id][in]=1,2,3');
    });

    it('should emit BTW as a greater_than_equal/less_than_equal pair', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[price][greater_than_equal]=10&where[price][less_than_equal]=100');
    });

    it('should throw if BTW does not receive exactly two values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit single-value NOT as not_equals', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[status][not_equals]=draft');
    });

    it('should emit multi-value NOT as not_in CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft', 'archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[status][not_in]=draft,archived');
    });

    it('should emit NULL as exists with inverted boolean', () => {
      const isNull = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const isNotNull = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [false] }]
      };

      expect(strategy.buildUri(isNull, options)).toContain('where[deletedAt][exists]=false');
      expect(strategy.buildUri(isNotNull, options)).toContain('where[deletedAt][exists]=true');
    });

    it('should throw if NULL does not receive exactly one boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should merge a simple filter and an operator filter on the same field', () => {
      const state = {
        ...baseState,
        filters: { price: [50] },
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.LT, values: [100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('where[price][equals]=50&where[price][less_than]=100');
    });

    it('should throw UnsupportedFilterOperatorError for SW and the FTS family', () => {
      const unsupported = [
        FilterOperatorEnum.SW,
        FilterOperatorEnum.FTS,
        FilterOperatorEnum.PHFTS,
        FilterOperatorEnum.PLFTS,
        FilterOperatorEnum.WFTS
      ];

      unsupported.forEach(operator => {
        const state = {
          ...baseState,
          operatorFilters: [{ field: 'title', operator, values: ['x'] }]
        };

        expect(() => strategy.buildUri(state, options)).toThrowError(UnsupportedFilterOperatorError);
      });
    });
  });

  describe('sorts', () => {
    it('should emit a CSV sort with - prefix for DESC', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'createdAt', order: SortEnum.DESC },
          { field: 'title', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-createdAt,title');
    });
  });

  describe('select', () => {
    it('should emit the flat select array as select[col]=true flags', () => {
      const state = { ...baseState, select: ['title', 'color'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('select[title]=true&select[color]=true');
    });
  });

  describe('limit validation', () => {
    it('should accept a positive integer', () => {
      expect(() => strategy.validateLimit(10)).not.toThrow();
    });

    it('should reject zero, negatives, and non-integers', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(-1)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(1.5)).toThrowError(InvalidLimitError);
    });
  });

  describe('capabilities', () => {
    it('should declare filters, operator filters, select, and sort only', () => {
      expect(strategy.capabilities).toEqual({
        embedded: false,
        fields: false,
        filters: true,
        includes: false,
        operatorFilters: true,
        search: false,
        select: true,
        sort: true
      });
    });
  });
});

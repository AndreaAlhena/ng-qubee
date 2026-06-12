import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { FeathersRequestStrategy } from './feathers-request.strategy';

describe('FeathersRequestStrategy', () => {
  let strategy: FeathersRequestStrategy;
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
    resource: 'messages',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new FeathersRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/messages?$limit=15&$skip=0');
  });

  it('should prepend the base URL when set', () => {
    const state = { ...baseState, baseUrl: 'https://api.example.com' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://api.example.com/messages?$limit=15&$skip=0');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('pagination', () => {
    it('should convert the page number to a $skip offset', () => {
      const state = { ...baseState, limit: 10, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$limit=10');
      expect(uri).toContain('$skip=20');
    });
  });

  describe('filters', () => {
    it('should emit a single-value filter as a bare exact match', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active');
    });

    it('should fold a multi-value filter to $in', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status[$in][0]=active&status[$in][1]=pending');
    });

    it('should emit multiple filters as separate params', () => {
      const state = {
        ...baseState,
        filters: { category: ['tech'], status: ['active'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('category=tech');
      expect(uri).toContain('status=active');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('status');
    });
  });

  describe('operator filters', () => {
    it('should emit EQ as a bare exact match', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'age', operator: FilterOperatorEnum.EQ, values: [18] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('age=18');
    });

    it('should emit comparison operators with the $op syntax', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'price', operator: FilterOperatorEnum.GT, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.LT, values: [100] },
          { field: 'price', operator: FilterOperatorEnum.LTE, values: [100] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price[$gt]=10');
      expect(uri).toContain('price[$gte]=10');
      expect(uri).toContain('price[$lt]=100');
      expect(uri).toContain('price[$lte]=100');
    });

    it('should emit IN as a $in array', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.IN, values: ['active', 'pending'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status[$in][0]=active&status[$in][1]=pending');
    });

    it('should emit BTW as a $gte/$lte pair on the same field', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price[$gte]=10&price[$lte]=100');
    });

    it('should throw if BTW does not receive exactly two values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit single-value NOT as $ne', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status[$ne]=archived');
    });

    it('should emit multi-value NOT as $nin', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'deleted'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status[$nin][0]=archived&status[$nin][1]=deleted');
    });

    it('should throw UnsupportedFilterOperatorError for operators without a Feathers equivalent', () => {
      const unsupported = [
        FilterOperatorEnum.CONTAINS,
        FilterOperatorEnum.ILIKE,
        FilterOperatorEnum.SW,
        FilterOperatorEnum.NULL,
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
    it('should emit ASC sorts as $sort[field]=1', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$sort[name]=1');
    });

    it('should emit DESC sorts as $sort[field]=-1', () => {
      const state = { ...baseState, sorts: [{ field: 'createdAt', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$sort[createdAt]=-1');
    });

    it('should emit multiple sorts inside a single $sort map', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'createdAt', order: SortEnum.DESC },
          { field: 'name', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$sort[createdAt]=-1&$sort[name]=1');
    });
  });

  describe('select', () => {
    it('should emit the flat select array as $select', () => {
      const state = { ...baseState, select: ['name', 'email'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$select[0]=name&$select[1]=email');
    });
  });

  describe('limit validation', () => {
    it('should accept a positive integer', () => {
      expect(() => strategy.validateLimit(1)).not.toThrow();
      expect(() => strategy.validateLimit(100)).not.toThrow();
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

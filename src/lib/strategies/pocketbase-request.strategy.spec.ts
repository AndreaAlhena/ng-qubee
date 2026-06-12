import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { PocketbaseRequestStrategy } from './pocketbase-request.strategy';

describe('PocketbaseRequestStrategy', () => {
  let strategy: PocketbaseRequestStrategy;
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
    strategy = new PocketbaseRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/posts?page=1&perPage=15');
  });

  it('should prepend the base URL when set', () => {
    const state = { ...baseState, baseUrl: 'https://pb.example.com/api/collections' };
    const uri = strategy.buildUri(state, options);

    expect(uri).toBe('https://pb.example.com/api/collections/posts?page=1&perPage=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value string filter quoted inside filter=()', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("filter=(status='active')");
    });

    it('should emit numeric filter values bare', () => {
      const state = { ...baseState, filters: { views: [10] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=(views=10)');
    });

    it('should fold a multi-value filter to an OR group', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("filter=((status='active' || status='pending'))");
    });

    it('should join multiple filters with &&', () => {
      const state = {
        ...baseState,
        filters: { category: ['tech'], status: ['active'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("filter=(category='tech' && status='active')");
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('filter=');
    });

    it('should backslash-escape single quotes in string values', () => {
      const state = { ...baseState, filters: { name: ["O'Brien"] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("filter=(name='O\\'Brien')");
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators as expression terms', () => {
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

      expect(uri).toContain('age=18');
      expect(uri).toContain('price>10');
      expect(uri).toContain('price>=10');
      expect(uri).toContain('price<100');
      expect(uri).toContain('price<=100');
    });

    it('should emit CONTAINS and ILIKE as the ~ operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] },
          { field: 'body', operator: FilterOperatorEnum.ILIKE, values: ['bar'] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("title~'foo'");
      expect(uri).toContain("body~'bar'");
    });

    it('should emit SW as ~ with an explicit trailing wildcard', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("title~'Intro%'");
    });

    it('should emit IN as an OR group', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.IN, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('(id=1 || id=2 || id=3)');
    });

    it('should emit BTW as an AND-ed >= / <= group', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('(price>=10 && price<=100)');
    });

    it('should throw if BTW does not receive exactly two values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit single-value NOT as !=', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("status!='draft'");
    });

    it('should emit multi-value NOT as an AND-ed != group', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft', 'archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("(status!='draft' && status!='archived')");
    });

    it('should emit NULL with boolean dispatch', () => {
      const isNull = {
        ...baseState,
        operatorFilters: [{ field: 'deleted', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const isNotNull = {
        ...baseState,
        operatorFilters: [{ field: 'deleted', operator: FilterOperatorEnum.NULL, values: [false] }]
      };

      expect(strategy.buildUri(isNull, options)).toContain('deleted=null');
      expect(strategy.buildUri(isNotNull, options)).toContain('deleted!=null');
    });

    it('should throw if NULL does not receive exactly one boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should merge simple and operator filters into one filter=() param', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        operatorFilters: [{ field: 'views', operator: FilterOperatorEnum.GT, values: [100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain("filter=(status='active' && views>100)");
    });

    it('should throw UnsupportedFilterOperatorError for the FTS family', () => {
      const unsupported = [
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
          { field: 'created', order: SortEnum.DESC },
          { field: 'title', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-created,title');
    });
  });

  describe('select', () => {
    it('should emit the flat select array as a fields CSV', () => {
      const state = { ...baseState, select: ['id', 'title'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=id,title');
    });
  });

  describe('includes', () => {
    it('should emit includes as an expand CSV', () => {
      const state = { ...baseState, includes: ['author', 'comments'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('expand=author,comments');
    });
  });

  describe('limit validation', () => {
    it('should accept a positive integer', () => {
      expect(() => strategy.validateLimit(30)).not.toThrow();
    });

    it('should reject zero, negatives, and non-integers', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(-1)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(1.5)).toThrowError(InvalidLimitError);
    });
  });

  describe('capabilities', () => {
    it('should declare filters, operator filters, includes, select, and sort', () => {
      expect(strategy.capabilities).toEqual({
        embedded: false,
        fields: false,
        filters: true,
        includes: true,
        operatorFilters: true,
        search: false,
        select: true,
        sort: true
      });
    });
  });
});

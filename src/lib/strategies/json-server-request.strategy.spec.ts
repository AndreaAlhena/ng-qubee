import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { JsonServerRequestStrategy } from './json-server-request.strategy';

describe('JsonServerRequestStrategy', () => {
  let strategy: JsonServerRequestStrategy;
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
    resource: 'items',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new JsonServerRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?_page=1&_per_page=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as a bare exact match', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active');
    });

    it('should emit a multi-value filter as field:in CSV', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status:in=active,pending');
    });

    it('should emit multiple filters as separate params', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active&category=tech');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('status');
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators with the colon syntax', () => {
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

      expect(uri).toContain('age:eq=18');
      expect(uri).toContain('price:gt=10');
      expect(uri).toContain('price:gte=10');
      expect(uri).toContain('price:lt=100');
      expect(uri).toContain('price:lte=100');
    });

    it('should emit CONTAINS as field:contains', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title:contains=foo');
    });

    it('should emit SW as field:startsWith', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title:startsWith=Intro');
    });

    it('should emit IN as field:in CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b', 'c'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('tag:in=a,b,c');
    });

    it('should expand BTW to two AND-ed segments', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price:gte=10&price:lte=100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NOT with a single value as field:ne', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status:ne=archived');
    });

    it('should expand NOT with multiple values to AND-ed :ne segments', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status:ne=archived&status:ne=draft');
    });

    it('should throw UnsupportedFilterOperatorError for ILIKE', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['foo'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(UnsupportedFilterOperatorError);
    });

    it('should throw UnsupportedFilterOperatorError for NULL', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(UnsupportedFilterOperatorError);
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
  });

  describe('sorting', () => {
    it('should emit an ASC sort with no prefix', () => {
      const state = { ...baseState, sorts: [{ field: 'title', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_sort=title');
    });

    it('should emit a DESC sort with a leading minus', () => {
      const state = { ...baseState, sorts: [{ field: 'views', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_sort=-views');
    });

    it('should emit mixed sorts joined by comma', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'views', order: SortEnum.DESC },
          { field: 'title', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_sort=-views,title');
    });
  });

  describe('search', () => {
    it('should emit the search term as q', () => {
      const state = { ...baseState, search: 'hello' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('q=hello');
    });
  });

  describe('pagination', () => {
    it('should emit _page and _per_page with the custom values', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('_page=3');
      expect(uri).toContain('_per_page=25');
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
    it('should keep the underscore-prefixed keys hardcoded regardless of options', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'lim', page: 'p', search: 'find', sort: 'srt' });
      const state = {
        ...baseState,
        search: 'hello',
        sorts: [{ field: 'title', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('_sort=title');
      expect(uri).toContain('q=hello');
      expect(uri).toContain('_page=1');
      expect(uri).toContain('_per_page=15');
      expect(uri).not.toContain('lim=');
      expect(uri).not.toContain('&p=');
      expect(uri).not.toContain('find=');
      expect(uri).not.toContain('srt=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete json-server query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { status: ['published'] },
        limit: 10,
        operatorFilters: [
          { field: 'views', operator: FilterOperatorEnum.GT, values: [100] }
        ],
        page: 2,
        resource: 'posts',
        search: 'hello',
        sorts: [{ field: 'views', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe(
        'https://api.example.com/posts?status=published&views:gt=100&_sort=-views&q=hello&_page=2&_per_page=10'
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

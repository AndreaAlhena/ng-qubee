import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { DirectusRequestStrategy } from './directus-request.strategy';

describe('DirectusRequestStrategy', () => {
  let strategy: DirectusRequestStrategy;
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
    strategy = new DirectusRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource, meta and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?meta=total_count,filter_count&limit=15&page=1');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as filter[field][_eq]', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status][_eq]=active');
    });

    it('should emit a multi-value filter as filter[field][_in] CSV', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status][_in]=active,pending');
    });

    it('should emit multiple filters in one bracketed block', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status][_eq]=active&filter[category][_eq]=tech');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('filter[');
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators with Directus underscore keys', () => {
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

      expect(uri).toContain('filter[age][_eq]=18');
      expect(uri).toContain('filter[price][_gt]=10');
      expect(uri).toContain('filter[price][_gte]=10');
      expect(uri).toContain('filter[price][_lt]=100');
      expect(uri).toContain('filter[price][_lte]=100');
    });

    it('should emit CONTAINS as _contains', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[title][_contains]=foo');
    });

    it('should emit ILIKE as _icontains', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['FOO'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[title][_icontains]=FOO');
    });

    it('should emit SW as _starts_with', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[title][_starts_with]=Intro');
    });

    it('should emit IN as _in CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b', 'c'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[tag][_in]=a,b,c');
    });

    it('should emit BTW as _between CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[price][_between]=10,100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NOT with a single value as _neq', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status][_neq]=archived');
    });

    it('should emit NOT with multiple values as _nin CSV', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status][_nin]=archived,draft');
    });

    it('should emit NULL=true as _null=true', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[deletedAt][_null]=true');
    });

    it('should emit NULL=false as _nnull=true', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[deletedAt][_nnull]=true');
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

    it('should merge a simple filter and an operator filter on the same field', () => {
      const state = {
        ...baseState,
        filters: { price: [100] },
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.LTE, values: [500] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[price][_eq]=100');
      expect(uri).toContain('filter[price][_lte]=500');
    });
  });

  describe('sorting', () => {
    it('should emit an ASC sort with no prefix', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name');
    });

    it('should emit a DESC sort with a leading minus', () => {
      const state = { ...baseState, sorts: [{ field: 'createdDate', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-createdDate');
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

      expect(uri).toContain('sort=likeCount,-createdDate');
    });
  });

  describe('fields', () => {
    it('should emit selected columns as a fields CSV', () => {
      const state = { ...baseState, select: ['id', 'name'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=id,name');
    });

    it('should emit includes as rel.* with a * flat part', () => {
      const state = { ...baseState, includes: ['orders', 'profile'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=*,orders.*,profile.*');
    });

    it('should emit embedded relations as dot-projected columns', () => {
      const state = { ...baseState, embedded: { orders: ['id', 'amount'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=*,orders.id,orders.amount');
    });

    it('should emit an embedded relation without columns as rel.*', () => {
      const state = { ...baseState, embedded: { orders: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=*,orders.*');
    });

    it('should fold a relation present in both includes and embedded into the embedded fragment', () => {
      const state = {
        ...baseState,
        embedded: { orders: ['id'] },
        includes: ['orders', 'profile']
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=*,profile.*,orders.id');
    });

    it('should keep explicit flat columns alongside relations', () => {
      const state = {
        ...baseState,
        embedded: { author: ['id', 'name'] },
        select: ['title']
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=title,author.id,author.name');
    });
  });

  describe('search', () => {
    it('should emit the search term', () => {
      const state = { ...baseState, search: 'blue' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('search=blue');
    });
  });

  describe('pagination', () => {
    it('should always emit meta=total_count,filter_count', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).toContain('meta=total_count,filter_count');
    });

    it('should emit limit and page with the custom values', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('limit=25');
      expect(uri).toContain('page=3');
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
    it('should honour custom filter, sort, fields, limit and page keys', () => {
      const customOptions = new QueryBuilderOptions({ fields: 'cols', filters: 'where', limit: 'size', page: 'p', sort: 'order' });
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        select: ['id'],
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('where[status][_eq]=active');
      expect(uri).toContain('order=name');
      expect(uri).toContain('cols=id');
      expect(uri).toContain('size=15');
      expect(uri).toContain('&p=1');
    });
  });

  describe('combined queries', () => {
    it('should build a complete Directus query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { status: ['published'] },
        includes: ['author'],
        limit: 10,
        operatorFilters: [
          { field: 'likeCount', operator: FilterOperatorEnum.GTE, values: [100] }
        ],
        page: 2,
        resource: 'articles',
        select: ['title'],
        sorts: [{ field: 'createdDate', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe(
        'https://api.example.com/articles?filter[status][_eq]=published&filter[likeCount][_gte]=100&sort=-createdDate&fields=title,author.*&meta=total_count,filter_count&limit=10&page=2'
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

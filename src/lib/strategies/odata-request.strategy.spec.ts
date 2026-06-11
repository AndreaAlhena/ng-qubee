import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { OdataRequestStrategy } from './odata-request.strategy';

describe('OdataRequestStrategy', () => {
  let strategy: OdataRequestStrategy;
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
    strategy = new OdataRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource, count and top', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?$count=true&$top=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value string filter as field eq quoted value', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=status eq \'active\'');
    });

    it('should emit a single-value number filter as a bare literal', () => {
      const state = { ...baseState, filters: { age: [18] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=age eq 18');
    });

    it('should emit a multi-value filter as the in list operator', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=status in (\'active\',\'pending\')');
    });

    it('should AND-join multiple filters in one $filter param', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=status eq \'active\' and category eq \'tech\'');
    });

    it('should escape embedded single quotes by doubling them', () => {
      const state = { ...baseState, filters: { name: ['O\'Brien'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=name eq \'O\'\'Brien\'');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('$filter=');
    });
  });

  describe('operator filters', () => {
    it('should emit comparison operators with OData keywords', () => {
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

      expect(uri).toContain('age eq 18');
      expect(uri).toContain('price gt 10');
      expect(uri).toContain('price ge 10');
      expect(uri).toContain('price lt 100');
      expect(uri).toContain('price le 100');
    });

    it('should emit CONTAINS as the contains() function', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('contains(title,\'foo\')');
    });

    it('should emit ILIKE as a tolower-wrapped contains()', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['FOO'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('contains(tolower(title),tolower(\'FOO\'))');
    });

    it('should emit SW as the startswith() function', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('startswith(title,\'Intro\')');
    });

    it('should emit IN as the in list operator', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b', 'c'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('tag in (\'a\',\'b\',\'c\')');
    });

    it('should expand BTW to two AND-ed terms', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price ge 10 and price le 100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NOT with a single value as field ne value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status ne \'archived\'');
    });

    it('should expand NOT with multiple values to AND-ed ne terms', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status ne \'archived\' and status ne \'draft\'');
    });

    it('should emit NULL=true as field eq null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt eq null');
    });

    it('should emit NULL=false as field ne null', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deletedAt', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deletedAt ne null');
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

    it('should AND-join simple and operator filters in one $filter param', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.GTE, values: [100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$filter=status eq \'active\' and price ge 100');
    });
  });

  describe('sorting', () => {
    it('should emit an ASC sort with an explicit asc suffix', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$orderby=name asc');
    });

    it('should emit a DESC sort with a desc suffix', () => {
      const state = { ...baseState, sorts: [{ field: 'createdDate', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$orderby=createdDate desc');
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

      expect(uri).toContain('$orderby=likeCount asc,createdDate desc');
    });
  });

  describe('select', () => {
    it('should emit selected columns as a $select CSV', () => {
      const state = { ...baseState, select: ['id', 'name'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$select=id,name');
    });
  });

  describe('expand', () => {
    it('should emit includes as bare $expand relations', () => {
      const state = { ...baseState, includes: ['orders', 'profile'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$expand=orders,profile');
    });

    it('should emit embedded relations with an inline $select projection', () => {
      const state = { ...baseState, embedded: { orders: ['id', 'amount'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$expand=orders($select=id,amount)');
    });

    it('should emit an embedded relation without columns as a bare relation', () => {
      const state = { ...baseState, embedded: { orders: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$expand=orders');
      expect(uri).not.toContain('orders(');
    });

    it('should fold a relation present in both includes and embedded into the embedded fragment', () => {
      const state = {
        ...baseState,
        embedded: { orders: ['id'] },
        includes: ['orders', 'profile']
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$expand=profile,orders($select=id)');
    });
  });

  describe('search', () => {
    it('should emit the search term as $search', () => {
      const state = { ...baseState, search: 'blue' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$search=blue');
    });
  });

  describe('pagination', () => {
    it('should always emit $count=true', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).toContain('$count=true');
    });

    it('should emit $top and a $skip derived from the page', () => {
      const state = { ...baseState, limit: 10, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('$top=10');
      expect(uri).toContain('$skip=20');
    });

    it('should omit $skip on page 1', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('$skip=');
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
    it('should keep the $-prefixed OData keys hardcoded regardless of options', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'flt', limit: 'lim', page: 'p', select: 'sel', sort: 'srt' });
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        select: ['id'],
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('$filter=status eq \'active\'');
      expect(uri).toContain('$orderby=name asc');
      expect(uri).toContain('$select=id');
      expect(uri).toContain('$top=15');
      expect(uri).not.toContain('flt=');
      expect(uri).not.toContain('lim=');
      expect(uri).not.toContain('&p=');
      expect(uri).not.toContain('sel=');
      expect(uri).not.toContain('srt=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete OData query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { category: ['Electronics'] },
        limit: 10,
        operatorFilters: [
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [100] }
        ],
        page: 2,
        resource: 'products',
        select: ['name', 'price'],
        sorts: [{ field: 'price', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe(
        'https://api.example.com/products?$filter=category eq \'Electronics\' and price ge 100&$orderby=price desc&$select=name,price&$count=true&$top=10&$skip=10'
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

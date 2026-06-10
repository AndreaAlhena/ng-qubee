 
import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { DrfRequestStrategy } from './drf-request.strategy';

describe('DrfRequestStrategy', () => {
  let strategy: DrfRequestStrategy;
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
    strategy = new DrfRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?page=1&page_size=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should generate URI with a single-value filter as field=value', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active');
      expect(uri).not.toContain('status__in');
    });

    it('should generate URI with multiple distinct filters', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active');
      expect(uri).toContain('category=tech');
    });

    it('should collapse multi-value filters to field__in=v1,v2,v3', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending', 'archived'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status__in=active,pending,archived');
    });

    it('should generate URI with boolean filter value', () => {
      const state = { ...baseState, filters: { published: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('published=true');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('status=');
    });
  });

  describe('operator filters', () => {
    it('should emit EQ without a lookup suffix', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'age', operator: FilterOperatorEnum.EQ, values: [18] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('age=18');
      expect(uri).not.toContain('age__');
    });

    it('should emit GT/GTE/LT/LTE with the expected lookup suffixes', () => {
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

      expect(uri).toContain('price__gt=10');
      expect(uri).toContain('price__gte=10');
      expect(uri).toContain('price__lt=100');
      expect(uri).toContain('price__lte=100');
    });

    it('should emit CONTAINS as field__contains=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('name__contains=foo');
    });

    it('should emit ILIKE as field__icontains=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.ILIKE, values: ['JOHN'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('name__icontains=JOHN');
    });

    it('should emit SW as field__startswith=value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.SW, values: ['Ja'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('name__startswith=Ja');
    });

    it('should emit IN as field__in=v1,v2,v3', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b', 'c'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('tag__in=a,b,c');
    });

    it('should emit BTW as field__range=min,max', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price__range=10,100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NULL=true as field__isnull=true', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deleted_at__isnull=true');
    });

    it('should emit NULL=false as field__isnull=false', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('deleted_at__isnull=false');
    });

    it('should throw InvalidFilterOperatorValueError when NULL receives a non-boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should throw UnsupportedFilterOperatorError for NOT', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
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

    it('should support a simple filter and operator filter on the same field side-by-side', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('status=active');
      expect(uri).toContain('status__isnull=false');
    });
  });

  describe('ordering', () => {
    it('should emit a single ASC sort with no prefix', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('ordering=name');
    });

    it('should emit a single DESC sort with a leading minus', () => {
      const state = { ...baseState, sorts: [{ field: 'created_at', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('ordering=-created_at');
    });

    it('should emit mixed sorts joined by comma', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'price', order: SortEnum.DESC },
          { field: 'name', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('ordering=-price,name');
    });
  });

  describe('search', () => {
    it('should emit a search parameter when set', () => {
      const state = { ...baseState, search: 'keyword' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('search=keyword');
    });

    it('should omit search when empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('search=');
    });
  });

  describe('pagination', () => {
    it('should emit page and page_size with the custom values', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page=3');
      expect(uri).toContain('page_size=25');
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

    it('should use a custom search key', () => {
      const customOptions = new QueryBuilderOptions({ search: 'q' });
      const state = { ...baseState, search: 'keyword' };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('q=keyword');
    });

    it('should keep ordering and page_size hardcoded regardless of options.sort/limit', () => {
      const customOptions = new QueryBuilderOptions({ sort: 'srt', limit: 'lim' });
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('ordering=name');
      expect(uri).not.toContain('srt=');
      expect(uri).toContain('page_size=15');
      expect(uri).not.toContain('lim=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete DRF query URI', () => {
      const state: IQueryBuilderState = {
        baseUrl: 'https://api.example.com',
        embedded: {},
        fields: {},
        filters: { status: ['published'] },
        includes: [],
        isLastPageKnown: false,
        lastPage: 1,
        limit: 10,
        operatorFilters: [
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [100] },
          { field: 'name', operator: FilterOperatorEnum.ILIKE, values: ['acme'] }
        ],
        page: 2,
        resource: 'products',
        search: 'widgets',
        select: [],
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/products?');
      expect(uri).toContain('status=published');
      expect(uri).toContain('price__gte=100');
      expect(uri).toContain('name__icontains=acme');
      expect(uri).toContain('ordering=-created_at');
      expect(uri).toContain('search=widgets');
      expect(uri).toContain('page=2');
      expect(uri).toContain('page_size=10');
    });
  });

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
  });
});

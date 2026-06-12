import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { NestjsxCrudRequestStrategy } from './nestjsx-crud-request.strategy';

describe('NestjsxCrudRequestStrategy', () => {
  let strategy: NestjsxCrudRequestStrategy;
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
    strategy = new NestjsxCrudRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?limit=15&page=1');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should fold a single-value filter to filter=field||$eq||value', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$eq||active');
    });

    it('should fold a multi-value filter to filter=field||$in||v1,v2', () => {
      const state = { ...baseState, filters: { status: ['active', 'pending'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$in||active,pending');
    });

    it('should emit one repeatable filter param per field', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$eq||active');
      expect(uri).toContain('filter=category||$eq||tech');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('filter=status');
    });

    it('should emit boolean filter values', () => {
      const state = { ...baseState, filters: { published: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=published||$eq||true');
    });
  });

  describe('operator filters', () => {
    it('should emit EQ/GT/GTE/LT/LTE/IN with identical operator names', () => {
      const state = {
        ...baseState,
        operatorFilters: [
          { field: 'age', operator: FilterOperatorEnum.EQ, values: [18] },
          { field: 'price', operator: FilterOperatorEnum.GT, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [10] },
          { field: 'price', operator: FilterOperatorEnum.LT, values: [100] },
          { field: 'price', operator: FilterOperatorEnum.LTE, values: [100] },
          { field: 'tag', operator: FilterOperatorEnum.IN, values: ['a', 'b'] }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=age||$eq||18');
      expect(uri).toContain('filter=price||$gt||10');
      expect(uri).toContain('filter=price||$gte||10');
      expect(uri).toContain('filter=price||$lt||100');
      expect(uri).toContain('filter=price||$lte||100');
      expect(uri).toContain('filter=tag||$in||a,b');
    });

    it('should emit CONTAINS as $cont', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.CONTAINS, values: ['foo'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=name||$cont||foo');
    });

    it('should emit ILIKE as $contL', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.ILIKE, values: ['JOHN'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=name||$contL||JOHN');
    });

    it('should emit SW as $starts', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'name', operator: FilterOperatorEnum.SW, values: ['Ja'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=name||$starts||Ja');
    });

    it('should emit BTW as $between with min,max', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 100] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=price||$between||10,100');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NOT with a single value as $ne', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$ne||archived');
    });

    it('should emit NOT with multiple values as $notin', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived', 'draft'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$notin||archived,draft');
    });

    it('should emit NULL=true as bare $isnull with no value segment', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=deleted_at||$isnull');
      expect(uri).not.toContain('$isnull||');
    });

    it('should emit NULL=false as bare $notnull with no value segment', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=deleted_at||$notnull');
      expect(uri).not.toContain('$notnull||');
    });

    it('should throw InvalidFilterOperatorValueError when NULL receives a non-boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
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

    it('should support a simple filter and operator filter on the same field side-by-side', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['archived'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter=status||$eq||active');
      expect(uri).toContain('filter=status||$ne||archived');
    });
  });

  describe('joins', () => {
    it('should emit one join param per include', () => {
      const state = { ...baseState, includes: ['posts', 'profile'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('join=posts');
      expect(uri).toContain('join=profile');
    });

    it('should omit join when includes is empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('join=');
    });
  });

  describe('field selection', () => {
    it('should emit fields as a comma-joined list', () => {
      const state = { ...baseState, select: ['name', 'email', 'age'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields=name,email,age');
    });

    it('should omit fields when select is empty', () => {
      const uri = strategy.buildUri(baseState, options);

      expect(uri).not.toContain('fields=');
    });
  });

  describe('sorting', () => {
    it('should emit a single ASC sort as sort=field,ASC', () => {
      const state = { ...baseState, sorts: [{ field: 'name', order: SortEnum.ASC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name,ASC');
    });

    it('should emit a DESC sort as sort=field,DESC', () => {
      const state = { ...baseState, sorts: [{ field: 'created_at', order: SortEnum.DESC }] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=created_at,DESC');
    });

    it('should emit one repeatable sort param per rule', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'name', order: SortEnum.ASC },
          { field: 'id', order: SortEnum.DESC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name,ASC&sort=id,DESC');
    });
  });

  describe('pagination', () => {
    it('should emit page and limit with the custom values', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page=3');
      expect(uri).toContain('limit=25');
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
    it('should use custom page and limit keys', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'per_page', page: 'p' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('p=1');
      expect(uri).toContain('per_page=15');
    });

    it('should keep filter, join, sort, and fields hardcoded regardless of options', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'flt', includes: 'inc', select: 'sel', sort: 'srt' });
      const state = {
        ...baseState,
        filters: { status: ['active'] },
        includes: ['posts'],
        select: ['name'],
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('filter=status||$eq||active');
      expect(uri).toContain('join=posts');
      expect(uri).toContain('fields=name');
      expect(uri).toContain('sort=name,ASC');
      expect(uri).not.toContain('flt=');
      expect(uri).not.toContain('inc=');
      expect(uri).not.toContain('sel=');
      expect(uri).not.toContain('srt=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete @nestjsx/crud query URI', () => {
      const state: IQueryBuilderState = {
        baseUrl: 'https://api.example.com',
        embedded: {},
        fields: {},
        filters: { status: ['published'] },
        includes: ['author'],
        isLastPageKnown: false,
        lastPage: 1,
        limit: 10,
        operatorFilters: [
          { field: 'price', operator: FilterOperatorEnum.GTE, values: [100] },
          { field: 'name', operator: FilterOperatorEnum.CONTAINS, values: ['acme'] }
        ],
        page: 2,
        resource: 'products',
        search: '',
        select: ['name', 'price'],
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/products?');
      expect(uri).toContain('fields=name,price');
      expect(uri).toContain('filter=status||$eq||published');
      expect(uri).toContain('filter=price||$gte||100');
      expect(uri).toContain('filter=name||$cont||acme');
      expect(uri).toContain('join=author');
      expect(uri).toContain('sort=created_at,DESC');
      expect(uri).toContain('limit=10');
      expect(uri).toContain('page=2');
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

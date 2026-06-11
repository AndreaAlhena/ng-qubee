import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { ApiPlatformRequestStrategy } from './api-platform-request.strategy';

describe('ApiPlatformRequestStrategy', () => {
  let strategy: ApiPlatformRequestStrategy;
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
    strategy = new ApiPlatformRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/items?page=1&itemsPerPage=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  describe('filters', () => {
    it('should emit a single-value filter as a bare exact match', () => {
      const state = { ...baseState, filters: { title: ['Ring'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title=Ring');
    });

    it('should emit a multi-value filter with the array syntax', () => {
      const state = { ...baseState, filters: { id: [1, 2] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id[]=1&id[]=2');
    });

    it('should pass relation dot paths through', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- relation dot paths are part of the API Platform wire format
      const state = { ...baseState, filters: { 'author.name': ['John'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('author.name=John');
    });

    it('should skip filters with empty value arrays', () => {
      const state = { ...baseState, filters: { title: [] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).not.toContain('title');
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

    it('should emit range operators in bracket syntax', () => {
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

      expect(uri).toContain('price[gt]=10');
      expect(uri).toContain('price[gte]=10');
      expect(uri).toContain('price[lt]=100');
      expect(uri).toContain('price[lte]=100');
    });

    it('should emit CONTAINS as the partial search strategy', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['hello'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title[partial]=hello');
    });

    it('should emit ILIKE as the ipartial search strategy', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['Hello'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title[ipartial]=Hello');
    });

    it('should emit SW as the start search strategy', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('title[start]=Intro');
    });

    it('should emit IN with the array syntax', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'id', operator: FilterOperatorEnum.IN, values: [1, 2, 3] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('id[]=1&id[]=2&id[]=3');
    });

    it('should emit BTW as between with a dotted range', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 50] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('price[between]=10..50');
    });

    it('should throw InvalidFilterOperatorValueError when BTW lacks 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should emit NULL=true as exists=false (IS NULL)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'author', operator: FilterOperatorEnum.NULL, values: [true] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('author[exists]=false');
    });

    it('should emit NULL=false as exists=true (IS NOT NULL)', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'author', operator: FilterOperatorEnum.NULL, values: [false] }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('author[exists]=true');
    });

    it('should throw InvalidFilterOperatorValueError when NULL receives a non-boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'author', operator: FilterOperatorEnum.NULL, values: ['yes'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('should throw UnsupportedFilterOperatorError for NOT', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft'] }]
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
    it('should emit one order param per rule', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'name', order: SortEnum.DESC },
          { field: 'id', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('order[name]=desc&order[id]=asc');
    });
  });

  describe('pagination', () => {
    it('should emit page and itemsPerPage with the custom values', () => {
      const state = { ...baseState, limit: 30, page: 2 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page=2');
      expect(uri).toContain('itemsPerPage=30');
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
    it('should use a custom page key but keep order and itemsPerPage hardcoded', () => {
      const customOptions = new QueryBuilderOptions({ limit: 'lim', page: 'p', sort: 'srt' });
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('order[name]=asc');
      expect(uri).toContain('p=1');
      expect(uri).toContain('itemsPerPage=15');
      expect(uri).not.toContain('lim=');
      expect(uri).not.toContain('srt=');
    });
  });

  describe('combined queries', () => {
    it('should build a complete API Platform query URI', () => {
      const state: IQueryBuilderState = {
        ...baseState,
        baseUrl: 'https://api.example.com',
        filters: { isPublished: [true] },
        limit: 30,
        operatorFilters: [
          { field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 50] },
          { field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['ring'] }
        ],
        page: 2,
        resource: 'books',
        sorts: [{ field: 'name', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toBe(
        'https://api.example.com/books?isPublished=true&price[between]=10..50&title[partial]=ring&order[name]=desc&page=2&itemsPerPage=30'
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

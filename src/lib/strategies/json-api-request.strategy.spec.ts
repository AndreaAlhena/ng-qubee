import { SortEnum } from '../enums/sort.enum';
import { UnselectableModelError } from '../errors/unselectable-model.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { JsonApiRequestStrategy } from './json-api-request.strategy';

describe('JsonApiRequestStrategy', () => {
  let strategy: JsonApiRequestStrategy;
  let options: QueryBuilderOptions;

  const baseState: IQueryBuilderState = {
    baseUrl: '',
    fields: {},
    filters: {},
    includes: [],
    limit: 15,
    operatorFilters: [],
    page: 1,
    resource: 'articles',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new JsonApiRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('should generate a basic URI with resource and bracket pagination', () => {
    const uri = strategy.buildUri(baseState, options);

    expect(uri).toBe('/articles?page[number]=1&page[size]=15');
  });

  it('should throw an error if resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  // Includes
  describe('includes', () => {
    it('should generate URI with a single include', () => {
      const state = { ...baseState, includes: ['author'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('include=author');
    });

    it('should generate URI with multiple includes', () => {
      const state = { ...baseState, includes: ['author', 'comments'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('include=author,comments');
    });

    it('should generate URI with nested dot-notation includes', () => {
      const state = { ...baseState, includes: ['author', 'comments.author'] };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('include=author,comments.author');
    });
  });

  // Fields
  describe('fields', () => {
    it('should generate URI with fields for a single type', () => {
      const state = {
        ...baseState,
        fields: { articles: ['title', 'body'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields[articles]=title,body');
    });

    it('should generate URI with fields for multiple types with includes', () => {
      const state = {
        ...baseState,
        fields: { articles: ['title', 'body'], people: ['name'] },
        includes: ['people']
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('fields[articles]=title,body');
      expect(uri).toContain('fields[people]=name');
    });

    it('should throw UnselectableModelError if field type is not resource or in includes', () => {
      const state = {
        ...baseState,
        fields: { articles: ['title'], people: ['name'] }
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(UnselectableModelError);
    });
  });

  // Filters
  describe('filters', () => {
    it('should generate URI with a single filter', () => {
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status]=active');
    });

    it('should generate URI with multiple filters', () => {
      const state = {
        ...baseState,
        filters: { status: ['active'], category: ['tech'] }
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[status]=active');
      expect(uri).toContain('filter[category]=tech');
    });

    it('should generate URI with boolean filter value', () => {
      const state = { ...baseState, filters: { published: [true] } };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filter[published]=true');
    });
  });

  // Sorts
  describe('sorts', () => {
    it('should generate URI with ASC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=name');
    });

    it('should generate URI with DESC sort', () => {
      const state = {
        ...baseState,
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-created_at');
    });

    it('should generate URI with mixed sorts', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'created_at', order: SortEnum.DESC },
          { field: 'name', order: SortEnum.ASC }
        ]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('sort=-created_at,name');
    });
  });

  // Pagination
  describe('pagination', () => {
    it('should include custom page number and page size', () => {
      const state = { ...baseState, limit: 25, page: 3 };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('page[number]=3');
      expect(uri).toContain('page[size]=25');
    });
  });

  // Base URL
  describe('base URL', () => {
    it('should prepend base URL when set', () => {
      const state = { ...baseState, baseUrl: 'https://api.example.com' };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/articles?');
    });
  });

  // Custom key names
  describe('custom key names', () => {
    it('should use custom fields key', () => {
      const customOptions = new QueryBuilderOptions({ fields: 'fld' });
      const state = {
        ...baseState,
        fields: { articles: ['title', 'body'] }
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('fld[articles]=title,body');
    });

    it('should use custom filter key', () => {
      const customOptions = new QueryBuilderOptions({ filters: 'flt' });
      const state = { ...baseState, filters: { status: ['active'] } };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('flt[status]=active');
    });

    it('should use custom includes key', () => {
      const customOptions = new QueryBuilderOptions({ includes: 'inc' });
      const state = { ...baseState, includes: ['author', 'comments'] };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('inc=author,comments');
    });

    it('should use custom page key for bracket pagination', () => {
      const customOptions = new QueryBuilderOptions({ page: 'pg' });
      const uri = strategy.buildUri(baseState, customOptions);

      expect(uri).toContain('pg[number]=1');
      expect(uri).toContain('pg[size]=15');
    });

    it('should use custom sort key', () => {
      const customOptions = new QueryBuilderOptions({ sort: 'srt' });
      const state = {
        ...baseState,
        sorts: [{ field: 'name', order: SortEnum.ASC }]
      };
      const uri = strategy.buildUri(state, customOptions);

      expect(uri).toContain('srt=name');
    });
  });

  // Combined query
  describe('combined queries', () => {
    it('should build a complete JSON:API query URI', () => {
      const state: IQueryBuilderState = {
        baseUrl: 'https://api.example.com',
        fields: { articles: ['title', 'body'] },
        filters: { status: ['published'] },
        includes: [],
        limit: 10,
        operatorFilters: [],
        page: 2,
        resource: 'articles',
        search: '',
        select: [],
        sorts: [{ field: 'created_at', order: SortEnum.DESC }]
      };
      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('https://api.example.com/articles?');
      expect(uri).toContain('fields[articles]=title,body');
      expect(uri).toContain('filter[status]=published');
      expect(uri).toContain('sort=-created_at');
      expect(uri).toContain('page[number]=2');
      expect(uri).toContain('page[size]=10');
    });
  });
});

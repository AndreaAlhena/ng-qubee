import { FilterOperatorEnum } from '../enums/filter-operator.enum';
import { SortEnum } from '../enums/sort.enum';
import { InvalidFilterOperatorValueError } from '../errors/invalid-filter-operator-value.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';
import { UnsupportedFilterOperatorError } from '../errors/unsupported-filter-operator.error';
import { IQueryBuilderState } from '../interfaces/query-builder-state.interface';
import { QueryBuilderOptions } from '../models/query-builder-options';
import { StrapiRequestStrategy } from './strapi-request.strategy';

describe('StrapiRequestStrategy', () => {
  let strategy: StrapiRequestStrategy;
  let options: QueryBuilderOptions;

  const baseState: IQueryBuilderState = {
    baseUrl: '',
    fields: {},
    filters: {},
    includes: [],
    isLastPageKnown: false,
    lastPage: 1,
    limit: 10,
    operatorFilters: [],
    page: 1,
    resource: 'articles',
    search: '',
    select: [],
    sorts: []
  };

  beforeEach(() => {
    strategy = new StrapiRequestStrategy();
    options = new QueryBuilderOptions({});
  });

  it('emits the bare pagination wrapper for a default state', () => {
    expect(strategy.buildUri(baseState, options)).toBe(
      '/articles?pagination[page]=1&pagination[pageSize]=10'
    );
  });

  it('throws when the resource is not set', () => {
    const state = { ...baseState, resource: '' };

    expect(() => strategy.buildUri(state, options)).toThrowError(
      'Set the resource property BEFORE adding filters or calling the url() / get() methods'
    );
  });

  it('honours baseUrl', () => {
    const state = { ...baseState, baseUrl: 'https://api.example.com' };

    expect(strategy.buildUri(state, options)).toBe(
      'https://api.example.com/articles?pagination[page]=1&pagination[pageSize]=10'
    );
  });

  describe('populate', () => {
    it('emits populate[N]=relation for each include', () => {
      const state = { ...baseState, includes: ['author', 'category'] };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?populate[0]=author&populate[1]=category&pagination[page]=1&pagination[pageSize]=10'
      );
    });
  });

  describe('fields (flat select)', () => {
    it('emits fields[N]=col from the select array', () => {
      const state = { ...baseState, select: ['title', 'description'] };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?fields[0]=title&fields[1]=description&pagination[page]=1&pagination[pageSize]=10'
      );
    });
  });

  describe('simple filters', () => {
    it('folds a single-value filter to $eq', () => {
      const state = { ...baseState, filters: { status: ['published'] } };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[status][$eq]=published&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('folds a multi-value filter to $in', () => {
      const state = { ...baseState, filters: { status: ['draft', 'published'] } };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[status][$in][0]=draft&filters[status][$in][1]=published&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('skips filter keys with empty value arrays', () => {
      const state = { ...baseState, filters: { status: [] } };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?pagination[page]=1&pagination[pageSize]=10'
      );
    });
  });

  describe('operator filters', () => {
    it('emits $gte single-value', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'rating', operator: FilterOperatorEnum.GTE, values: [4] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[rating][$gte]=4&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('emits $contains', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.CONTAINS, values: ['hello'] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[title][$contains]=hello&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates ILIKE to $containsi', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.ILIKE, values: ['Hello'] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[title][$containsi]=Hello&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates SW to $startsWith', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'title', operator: FilterOperatorEnum.SW, values: ['Intro'] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[title][$startsWith]=Intro&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates BTW to $between with [min, max]', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10, 50] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[price][$between][0]=10&filters[price][$between][1]=50&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('throws InvalidFilterOperatorValueError when BTW has !== 2 values', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'price', operator: FilterOperatorEnum.BTW, values: [10] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('translates NOT (single) to $ne', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft'] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[status][$ne]=draft&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates NOT (multi) to $notIn', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'status', operator: FilterOperatorEnum.NOT, values: ['draft', 'archived'] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[status][$notIn][0]=draft&filters[status][$notIn][1]=archived&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates NULL=true to $null=true', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [true] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[deleted_at][$null]=true&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('translates NULL=false to $notNull=true', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: [false] }]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?filters[deleted_at][$notNull]=true&pagination[page]=1&pagination[pageSize]=10'
      );
    });

    it('throws InvalidFilterOperatorValueError when NULL receives a non-boolean', () => {
      const state = {
        ...baseState,
        operatorFilters: [{ field: 'deleted_at', operator: FilterOperatorEnum.NULL, values: ['nope'] }]
      };

      expect(() => strategy.buildUri(state, options)).toThrowError(InvalidFilterOperatorValueError);
    });

    it('throws UnsupportedFilterOperatorError for PostgREST-only FTS variants', () => {
      [FilterOperatorEnum.FTS, FilterOperatorEnum.PHFTS, FilterOperatorEnum.PLFTS, FilterOperatorEnum.WFTS].forEach(op => {
        const state = {
          ...baseState,
          operatorFilters: [{ field: 'body', operator: op, values: ['term'] }]
        };

        expect(() => strategy.buildUri(state, options)).toThrowError(UnsupportedFilterOperatorError);
      });
    });

    it('merges simple and operator filters on the same field into one entry', () => {
      const state = {
        ...baseState,
        filters: { rating: ['5'] },
        operatorFilters: [{ field: 'rating', operator: FilterOperatorEnum.GTE, values: [4] }]
      };

      const uri = strategy.buildUri(state, options);

      expect(uri).toContain('filters[rating][$eq]=5');
      expect(uri).toContain('filters[rating][$gte]=4');
    });
  });

  describe('sort', () => {
    it('emits sort[N]=field:dir for each sort entry', () => {
      const state = {
        ...baseState,
        sorts: [
          { field: 'title', order: SortEnum.ASC },
          { field: 'createdAt', order: SortEnum.DESC }
        ]
      };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?sort[0]=title:asc&sort[1]=createdAt:desc&pagination[page]=1&pagination[pageSize]=10'
      );
    });
  });

  describe('pagination', () => {
    it('reflects state.page and state.limit', () => {
      const state = { ...baseState, page: 3, limit: 25 };

      expect(strategy.buildUri(state, options)).toBe(
        '/articles?pagination[page]=3&pagination[pageSize]=25'
      );
    });
  });

  describe('validateLimit', () => {
    it('accepts positive integers', () => {
      expect(() => strategy.validateLimit(1)).not.toThrow();
      expect(() => strategy.validateLimit(100)).not.toThrow();
    });

    it('rejects 0, negatives, and non-integers', () => {
      expect(() => strategy.validateLimit(0)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(-1)).toThrowError(InvalidLimitError);
      expect(() => strategy.validateLimit(1.5)).toThrowError(InvalidLimitError);
    });
  });

  describe('capabilities', () => {
    it('declares the Strapi feature matrix', () => {
      expect(strategy.capabilities).toEqual({
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

  it('emits all blocks together in canonical order', () => {
    const state: IQueryBuilderState = {
      ...baseState,
      includes: ['author'],
      select: ['title'],
      filters: { status: ['published'] },
      operatorFilters: [{ field: 'rating', operator: FilterOperatorEnum.GTE, values: [4] }],
      sorts: [{ field: 'createdAt', order: SortEnum.DESC }],
      page: 2,
      limit: 25
    };

    expect(strategy.buildUri(state, options)).toBe(
      '/articles' +
      '?populate[0]=author' +
      '&fields[0]=title' +
      '&filters[status][$eq]=published&filters[rating][$gte]=4' +
      '&sort[0]=createdAt:desc' +
      '&pagination[page]=2&pagination[pageSize]=25'
    );
  });
});

import { TestBed } from '@angular/core/testing';

import { NestService } from './nest.service';
import { SortEnum } from '../enums/sort.enum';

describe('NestService', () => {
  let service: NestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NestService]
    });

    service = TestBed.inject(NestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set base url', () => {
    service.baseUrl = 'https://dummy.domain';
    expect(service.nest().baseUrl).toBe('https://dummy.domain');
  });

  it('should set limit', () => {
    service.limit = 10;
    expect(service.nest().limit).toBe(10);
  });

  it('should set model', () => {
    service.model = 'users';
    expect(service.nest().model).toBe('users');
  });

  it('should set page', () => {
    service.page = 1;
    expect(service.nest().page).toBe(1);
  });

  it('should add fields', () => {
    service.addFields({
      users: ['id', 'username']
    });

    expect(service.nest().fields).toEqual({
      users: ['id', 'username']
    });
  });

  it('should add filters', () => {
    service.addFilters({
      id: [1, 2, 3]
    });

    expect(service.nest().filters).toEqual({
      id: [1, 2, 3]
    });
  });

  it('should add filters', () => {
    service.addFilters({
      id: [1, 2, 3]
    });

    expect(service.nest().filters).toEqual({
      id: [1, 2, 3]
    });
  });

  it('should add includes', () => {
    service.addIncludes(['profiles', 'settings']);
    expect(service.nest().includes).toEqual(['profiles', 'settings']);
  });

  it('should add sort', () => {
    service.addSort({
      field: 'id',
      order: SortEnum.DESC
    });

    expect(service.nest().sorts).toEqual([{
      field: 'id',
      order: SortEnum.DESC
    }]);
  });

  it('should delete fields', () => {
    service.addFields({
      users: ['id', 'username']
    });

    service.deleteFields({
      users: ['username']
    });

    expect(service.nest().fields).toEqual({
      users: ['id']
    });
  });

  it('should delete filters', () => {
    service.addFilters({
      id: [1, 2, 3],
      username: ['dummy']
    });

    service.deleteFilters('id');

    expect(service.nest().filters).toEqual({
      username: ['dummy']
    });
  });

  it('should delete includes', () => {
    service.addIncludes(['profiles', 'settings']);
    service.deleteIncludes('profiles');

    expect(service.nest().includes).toEqual(['settings']);
  });

  it('should delete sort', () => {
    service.addSort({
      field: 'id',
      order: SortEnum.DESC
    });

    service.addSort({
      field: 'username',
      order: SortEnum.ASC
    });

    service.deleteSorts('id');

    expect(service.nest().sorts).toEqual([{
      field: 'username',
      order: SortEnum.ASC
    }]);
  });

  it('should reset', () => {
    service.model = 'dummy';
    service.reset();
    expect(service.nest().model).toEqual('');
  });

  // Duplicate Prevention Tests
  describe('Duplicate Prevention', () => {
    describe('addFields', () => {
      it('should prevent duplicate fields for the same model', () => {
        service.addFields({
          users: ['id', 'username']
        });

        service.addFields({
          users: ['username', 'email']
        });

        expect(service.nest().fields).toEqual({
          users: ['id', 'username', 'email']
        });
      });

      it('should handle multiple models without duplicates', () => {
        service.addFields({
          users: ['id', 'username'],
          posts: ['title']
        });

        service.addFields({
          users: ['username', 'email'],
          posts: ['title', 'content']
        });

        expect(service.nest().fields).toEqual({
          users: ['id', 'username', 'email'],
          posts: ['title', 'content']
        });
      });

      it('should not create duplicates when adding the same field multiple times', () => {
        service.addFields({
          users: ['id', 'id', 'id']
        });

        expect(service.nest().fields).toEqual({
          users: ['id']
        });
      });
    });

    describe('addFilters', () => {
      it('should prevent duplicate filter values for the same key', () => {
        service.addFilters({
          id: [1, 2, 3]
        });

        service.addFilters({
          id: [2, 3, 4]
        });

        expect(service.nest().filters).toEqual({
          id: [1, 2, 3, 4]
        });
      });

      it('should handle multiple filter keys without duplicates', () => {
        service.addFilters({
          id: [1, 2],
          status: ['active']
        });

        service.addFilters({
          id: [2, 3],
          status: ['active', 'pending']
        });

        expect(service.nest().filters).toEqual({
          id: [1, 2, 3],
          status: ['active', 'pending']
        });
      });

      it('should not create duplicates when adding the same filter value multiple times', () => {
        service.addFilters({
          id: [1, 1, 1]
        });

        expect(service.nest().filters).toEqual({
          id: [1]
        });
      });
    });

    describe('addIncludes', () => {
      it('should prevent duplicate includes', () => {
        service.addIncludes(['profiles', 'settings']);
        service.addIncludes(['settings', 'posts']);

        expect(service.nest().includes).toEqual(['profiles', 'settings', 'posts']);
      });

      it('should not create duplicates when adding the same include multiple times', () => {
        service.addIncludes(['profiles', 'profiles', 'profiles']);

        expect(service.nest().includes).toEqual(['profiles']);
      });

      it('should handle empty arrays', () => {
        service.addIncludes(['profiles']);
        service.addIncludes([]);

        expect(service.nest().includes).toEqual(['profiles']);
      });
    });
  });
});

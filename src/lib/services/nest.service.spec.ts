import { TestBed } from '@angular/core/testing';

import { NestService } from './nest.service';
import { SortEnum } from '../enums/sort.enum';
import { InvalidModelNameError } from '../errors/invalid-model-name.error';
import { InvalidPageNumberError } from '../errors/invalid-page-number.error';
import { InvalidLimitError } from '../errors/invalid-limit.error';

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

  // Deep Cloning Tests
  describe('Deep Cloning', () => {
    describe('deleteFields', () => {
      it('should not mutate the original state when deleting fields', () => {
        service.addFields({
          users: ['id', 'username', 'email']
        });

        // Get a reference to the original state
        const originalFields = service.nest().fields;
        const originalUsersFields = [...originalFields.users];

        // Delete a field
        service.deleteFields({
          users: ['username']
        });

        // Verify the original reference hasn't changed
        expect(originalUsersFields).toEqual(['id', 'username', 'email']);

        // Verify the new state is correct
        expect(service.nest().fields).toEqual({
          users: ['id', 'email']
        });
      });

      it('should handle deep cloning with multiple models', () => {
        service.addFields({
          users: ['id', 'username'],
          posts: ['title', 'content']
        });

        const originalState = service.nest().fields;

        service.deleteFields({
          users: ['username']
        });

        // Original posts should remain unchanged
        expect(service.nest().fields.posts).toEqual(['title', 'content']);
        expect(service.nest().fields.users).toEqual(['id']);
      });
    });

    describe('deleteFilters', () => {
      it('should not mutate the original state when deleting filters', () => {
        service.addFilters({
          id: [1, 2, 3],
          status: ['active', 'pending']
        });

        // Get a reference to the original state
        const originalFilters = service.nest().filters;
        const originalIdFilter = [...originalFilters.id];
        const originalStatusFilter = [...originalFilters.status];

        // Delete a filter
        service.deleteFilters('id');

        // Verify the original references haven't changed
        expect(originalIdFilter).toEqual([1, 2, 3]);
        expect(originalStatusFilter).toEqual(['active', 'pending']);

        // Verify the new state is correct
        expect(service.nest().filters).toEqual({
          status: ['active', 'pending']
        });
      });

      it('should handle deep cloning when deleting multiple filters', () => {
        service.addFilters({
          id: [1, 2, 3],
          status: ['active'],
          type: ['user']
        });

        service.deleteFilters('id', 'type');

        expect(service.nest().filters).toEqual({
          status: ['active']
        });
      });

      it('should not affect other filters when deleting one', () => {
        service.addFilters({
          id: [1, 2, 3],
          status: ['active', 'pending'],
          type: ['user', 'admin']
        });

        const originalStatusValues = service.nest().filters.status;

        service.deleteFilters('id');

        // Status filter should remain completely unchanged
        expect(service.nest().filters.status).toEqual(['active', 'pending']);
        expect(service.nest().filters.type).toEqual(['user', 'admin']);
      });
    });
  });

  // Input Validation Tests
  describe('Input Validation', () => {
    describe('model validation', () => {
      it('should throw InvalidModelNameError for empty string', () => {
        expect(() => {
          service.model = '';
        }).toThrow(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for whitespace-only string', () => {
        expect(() => {
          service.model = '   ';
        }).toThrow(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for null', () => {
        expect(() => {
          service.model = null as any;
        }).toThrow(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for undefined', () => {
        expect(() => {
          service.model = undefined as any;
        }).toThrow(InvalidModelNameError);
      });

      it('should accept valid model name', () => {
        expect(() => {
          service.model = 'users';
        }).not.toThrow();
        expect(service.nest().model).toBe('users');
      });
    });

    describe('page validation', () => {
      it('should throw InvalidPageNumberError for zero', () => {
        expect(() => {
          service.page = 0;
        }).toThrow(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for negative numbers', () => {
        expect(() => {
          service.page = -1;
        }).toThrow(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for decimal numbers', () => {
        expect(() => {
          service.page = 1.5;
        }).toThrow(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for NaN', () => {
        expect(() => {
          service.page = NaN;
        }).toThrow(InvalidPageNumberError);
      });

      it('should accept valid page number (1)', () => {
        expect(() => {
          service.page = 1;
        }).not.toThrow();
        expect(service.nest().page).toBe(1);
      });

      it('should accept valid page number (100)', () => {
        expect(() => {
          service.page = 100;
        }).not.toThrow();
        expect(service.nest().page).toBe(100);
      });
    });

    describe('limit validation', () => {
      it('should throw InvalidLimitError for zero', () => {
        expect(() => {
          service.limit = 0;
        }).toThrow(InvalidLimitError);
      });

      it('should throw InvalidLimitError for negative numbers', () => {
        expect(() => {
          service.limit = -10;
        }).toThrow(InvalidLimitError);
      });

      it('should throw InvalidLimitError for decimal numbers', () => {
        expect(() => {
          service.limit = 15.5;
        }).toThrow(InvalidLimitError);
      });

      it('should throw InvalidLimitError for NaN', () => {
        expect(() => {
          service.limit = NaN;
        }).toThrow(InvalidLimitError);
      });

      it('should accept valid limit (1)', () => {
        expect(() => {
          service.limit = 1;
        }).not.toThrow();
        expect(service.nest().limit).toBe(1);
      });

      it('should accept valid limit (50)', () => {
        expect(() => {
          service.limit = 50;
        }).not.toThrow();
        expect(service.nest().limit).toBe(50);
      });
    });
  });
});

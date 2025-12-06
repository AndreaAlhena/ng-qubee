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
        const originalUsersFields = [...originalFields['users']];

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
        expect(service.nest().fields['posts']).toEqual(['title', 'content']);
        expect(service.nest().fields['users']).toEqual(['id']);
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
        const originalIdFilter = [...originalFilters['id']];
        const originalStatusFilter = [...originalFilters['status']];

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

        const originalStatusValues = service.nest().filters['status'];

        service.deleteFilters('id');

        // Status filter should remain completely unchanged
        expect(service.nest().filters['status']).toEqual(['active', 'pending']);
        expect(service.nest().filters['type']).toEqual(['user', 'admin']);
      });
    });
  });

  // Input Validation Tests
  describe('Input Validation', () => {
    describe('model validation', () => {
      it('should throw InvalidModelNameError for empty string', () => {
        expect(() => {
          service.model = '';
        }).toThrowError(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for whitespace-only string', () => {
        expect(() => {
          service.model = '   ';
        }).toThrowError(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for null', () => {
        expect(() => {
          service.model = null as any;
        }).toThrowError(InvalidModelNameError);
      });

      it('should throw InvalidModelNameError for undefined', () => {
        expect(() => {
          service.model = undefined as any;
        }).toThrowError(InvalidModelNameError);
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
        }).toThrowError(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for negative numbers', () => {
        expect(() => {
          service.page = -1;
        }).toThrowError(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for decimal numbers', () => {
        expect(() => {
          service.page = 1.5;
        }).toThrowError(InvalidPageNumberError);
      });

      it('should throw InvalidPageNumberError for NaN', () => {
        expect(() => {
          service.page = NaN;
        }).toThrowError(InvalidPageNumberError);
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
        }).toThrowError(InvalidLimitError);
      });

      it('should throw InvalidLimitError for negative numbers', () => {
        expect(() => {
          service.limit = -10;
        }).toThrowError(InvalidLimitError);
      });

      it('should throw InvalidLimitError for decimal numbers', () => {
        expect(() => {
          service.limit = 15.5;
        }).toThrowError(InvalidLimitError);
      });

      it('should throw InvalidLimitError for NaN', () => {
        expect(() => {
          service.limit = NaN;
        }).toThrowError(InvalidLimitError);
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

  // Edge Case Tests
  describe('Edge Cases', () => {
    describe('empty arrays and objects', () => {
      it('should handle empty fields object', () => {
        service.addFields({});
        expect(service.nest().fields).toEqual({});
      });

      it('should handle empty filters object', () => {
        service.addFilters({});
        expect(service.nest().filters).toEqual({});
      });

      it('should handle empty includes array', () => {
        service.addIncludes([]);
        expect(service.nest().includes).toEqual([]);
      });

      it('should handle adding fields with empty array values', () => {
        service.addFields({ users: [] });
        expect(service.nest().fields).toEqual({ users: [] });
      });

      it('should handle adding filters with empty array values', () => {
        service.addFilters({ id: [] });
        expect(service.nest().filters).toEqual({ id: [] });
      });
    });

    describe('boundary values', () => {
      it('should accept limit value of 1', () => {
        service.limit = 1;
        expect(service.nest().limit).toBe(1);
      });

      it('should accept page value of 1', () => {
        service.page = 1;
        expect(service.nest().page).toBe(1);
      });

      it('should accept very large limit value', () => {
        service.limit = 1000000;
        expect(service.nest().limit).toBe(1000000);
      });

      it('should accept very large page value', () => {
        service.page = 1000000;
        expect(service.nest().page).toBe(1000000);
      });
    });

    describe('string edge cases', () => {
      it('should handle model names with special characters', () => {
        service.model = 'user-profiles';
        expect(service.nest().model).toBe('user-profiles');
      });

      it('should handle model names with numbers', () => {
        service.model = 'users123';
        expect(service.nest().model).toBe('users123');
      });

      it('should handle model names with underscores', () => {
        service.model = 'user_profiles';
        expect(service.nest().model).toBe('user_profiles');
      });

      it('should handle baseUrl with trailing slash', () => {
        service.baseUrl = 'https://api.example.com/';
        expect(service.nest().baseUrl).toBe('https://api.example.com/');
      });

      it('should handle baseUrl without trailing slash', () => {
        service.baseUrl = 'https://api.example.com';
        expect(service.nest().baseUrl).toBe('https://api.example.com');
      });
    });

    describe('multiple operations', () => {
      it('should handle adding fields multiple times for same model', () => {
        service.addFields({ users: ['id', 'name'] });
        service.addFields({ users: ['email'] });
        service.addFields({ users: ['age'] });

        expect(service.nest().fields['users']).toEqual(['id', 'name', 'email', 'age']);
      });

      it('should handle adding filters multiple times for same key', () => {
        service.addFilters({ status: ['active'] });
        service.addFilters({ status: ['pending'] });
        service.addFilters({ status: ['completed'] });

        expect(service.nest().filters['status']).toEqual(['active', 'pending', 'completed']);
      });

      it('should handle adding includes multiple times', () => {
        service.addIncludes(['profile']);
        service.addIncludes(['posts']);
        service.addIncludes(['comments']);

        expect(service.nest().includes).toEqual(['profile', 'posts', 'comments']);
      });

      it('should handle adding multiple sorts', () => {
        service.addSort({ field: 'name', order: SortEnum.ASC });
        service.addSort({ field: 'created_at', order: SortEnum.DESC });
        service.addSort({ field: 'id', order: SortEnum.ASC });

        expect(service.nest().sorts).toEqual([
          { field: 'name', order: SortEnum.ASC },
          { field: 'created_at', order: SortEnum.DESC },
          { field: 'id', order: SortEnum.ASC }
        ]);
      });
    });

    describe('delete operations edge cases', () => {
      it('should handle deleting non-existent field', () => {
        service.addFields({ users: ['id', 'name'] });
        service.deleteFields({ posts: ['title'] });

        expect(service.nest().fields).toEqual({ users: ['id', 'name'] });
      });

      it('should handle deleting non-existent filter', () => {
        service.addFilters({ id: [1, 2, 3] });
        service.deleteFilters('status');

        expect(service.nest().filters).toEqual({ id: [1, 2, 3] });
      });

      it('should handle deleting non-existent include', () => {
        service.addIncludes(['profile']);
        service.deleteIncludes('posts');

        expect(service.nest().includes).toEqual(['profile']);
      });

      it('should handle deleting non-existent sort', () => {
        service.addSort({ field: 'name', order: SortEnum.ASC });
        service.deleteSorts('created_at');

        expect(service.nest().sorts).toEqual([{ field: 'name', order: SortEnum.ASC }]);
      });

      it('should handle deleting all fields from a model', () => {
        service.addFields({ users: ['id', 'name', 'email'] });
        service.deleteFields({ users: ['id', 'name', 'email'] });

        expect(service.nest().fields['users']).toEqual([]);
      });

      it('should handle deleting all includes', () => {
        service.addIncludes(['profile', 'posts', 'comments']);
        service.deleteIncludes('profile', 'posts', 'comments');

        expect(service.nest().includes).toEqual([]);
      });

      it('should handle deleting all sorts', () => {
        service.addSort({ field: 'name', order: SortEnum.ASC });
        service.addSort({ field: 'created_at', order: SortEnum.DESC });
        service.deleteSorts('name', 'created_at');

        expect(service.nest().sorts).toEqual([]);
      });
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    describe('complete query building workflow', () => {
      it('should build a complete query with all parameters', () => {
        service.baseUrl = 'https://api.example.com';
        service.model = 'users';
        service.page = 2;
        service.limit = 25;

        service.addFields({ users: ['id', 'email', 'username'] });
        service.addFilters({ status: ['active'], role: ['admin'] });
        service.addIncludes(['profile', 'posts']);
        service.addSort({ field: 'created_at', order: SortEnum.DESC });

        const state = service.nest();

        expect(state.baseUrl).toBe('https://api.example.com');
        expect(state.model).toBe('users');
        expect(state.page).toBe(2);
        expect(state.limit).toBe(25);
        expect(state.fields).toEqual({ users: ['id', 'email', 'username'] });
        expect(state.filters).toEqual({ status: ['active'], role: ['admin'] });
        expect(state.includes).toEqual(['profile', 'posts']);
        expect(state.sorts).toEqual([{ field: 'created_at', order: SortEnum.DESC }]);
      });

      it('should reset and rebuild query', () => {
        // Build initial query
        service.model = 'users';
        service.addFields({ users: ['id'] });
        service.addFilters({ status: ['active'] });

        expect(service.nest().model).toBe('users');

        // Reset
        service.reset();

        expect(service.nest()).toEqual({
          baseUrl: '',
          fields: {},
          filters: {},
          includes: [],
          limit: 15,
          model: '',
          page: 1,
          sorts: []
        });

        // Rebuild
        service.model = 'posts';
        service.addFields({ posts: ['title'] });

        expect(service.nest().model).toBe('posts');
        expect(service.nest().fields).toEqual({ posts: ['title'] });
      });

      it('should handle complex multi-model field selection', () => {
        service.addFields({ users: ['id', 'email'] });
        service.addFields({ posts: ['title', 'content'] });
        service.addFields({ comments: ['text', 'author_id'] });

        expect(service.nest().fields).toEqual({
          users: ['id', 'email'],
          posts: ['title', 'content'],
          comments: ['text', 'author_id']
        });
      });

      it('should handle complex multi-key filtering', () => {
        service.addFilters({ id: [1, 2, 3] });
        service.addFilters({ status: ['active', 'pending'] });
        service.addFilters({ role: ['admin', 'moderator', 'user'] });

        expect(service.nest().filters).toEqual({
          id: [1, 2, 3],
          status: ['active', 'pending'],
          role: ['admin', 'moderator', 'user']
        });
      });

      it('should maintain state immutability across multiple reads', () => {
        service.model = 'users';
        service.addFields({ users: ['id'] });

        const state1 = service.nest();
        const state2 = service.nest();

        // States should be equal but not the same reference
        expect(state1).toEqual(state2);
        expect(state1).not.toBe(state2);
      });
    });

    describe('modification and deletion workflow', () => {
      it('should add, modify, and delete fields correctly', () => {
        // Add initial fields
        service.addFields({ users: ['id', 'name', 'email'] });
        expect(service.nest().fields['users']).toEqual(['id', 'name', 'email']);

        // Add more fields
        service.addFields({ users: ['age', 'country'] });
        expect(service.nest().fields['users']).toEqual(['id', 'name', 'email', 'age', 'country']);

        // Delete some fields
        service.deleteFields({ users: ['email', 'country'] });
        expect(service.nest().fields['users']).toEqual(['id', 'name', 'age']);
      });

      it('should add, modify, and delete filters correctly', () => {
        // Add initial filters
        service.addFilters({ status: ['active'] });
        expect(service.nest().filters['status']).toEqual(['active']);

        // Add more filters
        service.addFilters({ status: ['pending', 'completed'] });
        expect(service.nest().filters['status']).toEqual(['active', 'pending', 'completed']);

        // Delete filter completely
        service.deleteFilters('status');
        expect(service.nest().filters).toEqual({});
      });

      it('should handle mixed operations in sequence', () => {
        // Setup
        service.model = 'users';
        service.page = 1;
        service.limit = 20;

        // Add data
        service.addFields({ users: ['id', 'name'] });
        service.addFilters({ status: ['active'] });
        service.addIncludes(['profile']);
        service.addSort({ field: 'created_at', order: SortEnum.DESC });

        // Verify state
        expect(service.nest().fields['users']).toEqual(['id', 'name']);

        // Modify
        service.addFields({ users: ['email'] });
        service.page = 2;

        // Verify modifications
        expect(service.nest().fields['users']).toEqual(['id', 'name', 'email']);
        expect(service.nest().page).toBe(2);

        // Delete some data
        service.deleteFields({ users: ['name'] });
        service.deleteIncludes('profile');

        // Verify deletions
        expect(service.nest().fields['users']).toEqual(['id', 'email']);
        expect(service.nest().includes).toEqual([]);

        // Reset and verify clean state
        service.reset();
        expect(service.nest().model).toBe('');
        expect(service.nest().fields).toEqual({});
      });
    });

    describe('signal reactivity', () => {
      it('should emit new values when state changes', () => {
        const initialState = service.nest();
        expect(initialState.model).toBe('');

        service.model = 'users';
        const updatedState = service.nest();

        expect(updatedState.model).toBe('users');
        expect(updatedState).not.toBe(initialState);
      });

      it('should provide isolated state snapshots', () => {
        service.addFields({ users: ['id'] });

        const snapshot1 = service.nest();
        const fields1 = snapshot1.fields;

        service.addFields({ users: ['name'] });

        const snapshot2 = service.nest();
        const fields2 = snapshot2.fields;

        // Original snapshot should remain unchanged
        expect(fields1['users']).toEqual(['id']);
        expect(fields2['users']).toEqual(['id', 'name']);
      });
    });
  });
});

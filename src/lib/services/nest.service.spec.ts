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
});

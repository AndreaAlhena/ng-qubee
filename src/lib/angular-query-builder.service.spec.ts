import { TestBed } from '@angular/core/testing';
import { AngularQueryBuilderService } from './angular-query-builder.service';
import { SortEnum } from './enums/sort.enum';
import { UnselectableModelError } from './errors/unselectable-model.error';

describe('AngularQueryBuilderService', () => {
  let service: AngularQueryBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: AngularQueryBuilderService,
        useFactory: () =>
          new AngularQueryBuilderService()
      }]
    });
    service = TestBed.inject(AngularQueryBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a URI', () => {
    expect(service.generateUrl('users')).toContain('/users');
  });

  it('should generate a URI with a custom limit', () => {
    service.limit = 25;
    expect(service.generateUrl('users')).toContain('limit=25');
  });

  it('should generate a URI with a default limit', () => {
    expect(service.generateUrl('users')).toContain('limit=15');
  });

  it('should generate a URI with a custom page', () => {
    service.page = 5;
    expect(service.generateUrl('users')).toContain('page=5');
  });

  it('should generate a URI with a default page', () => {
    expect(service.generateUrl('users')).toContain('page=1');
  });

  it('should generate a URI with fields (single model)', () => {
    service.fields = {users: ['email', 'name']};

    expect(service.generateUrl('users')).toContain('fields[users]=email,name');
  });

  it('should generate a URI with included models', () => {
    service.includes = ['model1', 'model2'];
    expect(service.generateUrl('users')).toContain('includes=model1,model2');
  });

  it('should generate a URI with fields (multiple models)', () => {
    service.fields = {users: ['email', 'name'], settings: ['field1', 'field2']};
    service.includes = ['settings'];
    const ret = service.generateUrl('users');

    expect(ret).toContain('fields[users]=email,name');
    expect(ret).toContain('fields[settings]=field1,field2');
  });

  it('should generate a URI with sorted fields ASC', () => {
    service.sort = {
      f: SortEnum.ASC
    };

    expect(service.generateUrl('users')).toContain('sort=f');
  })

  it('should generate a URI with sorted fields DESC', () => {
    service.sort = {
      f: SortEnum.DESC
    };

    expect(service.generateUrl('users')).toContain('sort=-f');
  })

  it('should generate a URL if a base url is given', () => {
    service.baseUrl = 'https://domain.com';
    expect(service.generateUrl('users')).toContain('https://domain.com/users');
  });

  it('should throw an error if the model requested as field is not the model property / included in the includes object', () => {
    service.fields = {users: ['email', 'name'], settings: ['field1', 'field2']};

    try {
      service.generateUrl('users');
    } catch (err) {
      expect(err.message).toEqual(new UnselectableModelError('settings').message);
    }
  });
});

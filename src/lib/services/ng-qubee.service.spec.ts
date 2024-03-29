import { TestBed } from '@angular/core/testing';
import { SortEnum } from '../enums/sort.enum';
import { NgQubeeService } from './ng-qubee.service';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { NestService } from './nest.service';

describe('NgQubeeService standard config', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService)
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a URI', (done: DoneFn) => {
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('/users');
      done();
    });
  });

  it('should generate a URI with a custom limit', (done: DoneFn) => {
    service.setModel('users');
    service.setLimit(25);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('limit=25');
      done();
    });
  });

  it('should generate a URI with a default limit', (done: DoneFn) => {
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('limit=15');
      done();
    });
  });

  it('should generate a URI with a custom page', (done: DoneFn) => {
    service.setModel('users');
    service.setPage(5);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('page=5');
      done();
    });
  });

  it('should generate a URI with a default page', (done: DoneFn) => {
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('page=1');
      done();
    });
  });

  it('should generate a URI with fields (single model)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fields[users]=email,name');
      done();
    });
  });

  it('should ignore empty fields (single model)', (done: DoneFn) => {
    service.addFields('users', []);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).not.toContain('fields[users]=');
      done();
    });
  });

  it('should generate a URI with included models', (done: DoneFn) => {
    service.addIncludes('model1', 'model2');
    service.addIncludes('model3');
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toBe('/users?include=model1,model2,model3&limit=15&page=1');
      done();
    });
  });

  it('should generate a URI with fields (multiple models)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.addFields('settings', ['field1', 'field2']);
    service.addIncludes('settings');
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fields[users]=email,name');
      expect(uri).toContain('fields[settings]=field1,field2');
      done();
    });
  });

  it('should generate a URI with filter (multiple values)', (done: DoneFn) => {
    service.addFilter('id', 1, 2, 3);
    service.addFilter('name', 'doe');
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[id]=1,2,3');
      expect(uri).toContain('filter[name]=doe');
      done();
    });
  });

  it('should generate a URI with filter (mixed values)', (done: DoneFn) => {
    service.addFilter('field', 1, '2', 3);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[field]=1,2,3');
      done();
    });
  });

  it('should ignore empty filters', (done: DoneFn) => {
    service.addFilter('field');
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).not.toContain('filter[field]=');
      done();
    });
  });

  it('should generate a URI with filter (boolean value)', (done: DoneFn) => {
    service.addFilter('isActive', true);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('filter[isActive]=true');
      done();
    });
  });

  it('should generate a URI with sorted field ASC', (done: DoneFn) => {
    service.addSort('f', SortEnum.ASC);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=f');
      done();
    });
  });

  it('should generate a URI with sorted fields mixed ASC and DESC', (done: DoneFn) => {
    service.addSort('f1', SortEnum.DESC);
    service.addSort('f2', SortEnum.ASC);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=-f1,f2');
      done();
    });
  });

  it('should generate a URI with sorted field DESC', (done: DoneFn) => {
    service.addSort('f', SortEnum.DESC);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('sort=-f');
      done();
    });
  });

  it('should reset the internal state', (done: DoneFn) => {
    service.setModel('users');
    service.addFields('settings', ['a']);
    service.reset();
    service.setModel('settings');

    service.generateUri().subscribe(uri => {
      expect(uri).toBe('/settings?limit=15&page=1');
      done();
    });
  });

  // it('should generate a URL if a base url is given', (done: DoneFn) => {
  //   service.setModel('users');
  //   service.setBaseUrl('https://domain.com');

  //   service.generateUri().subscribe(uri => {
  //     expect(uri).toContain('https://domain.com/users');
  //     done();
  //   });
  // });

  // it('should throw an error if the model requested as field is not the model property / included in the includes object', () => {
  //   service.fields = {users: ['email', 'name'], settings: ['field1', 'field2']};

  //   try {
  //     service.generateUri('users');
  //   } catch (err) {
  //     expect(err.message).toEqual(new UnselectableModelError('settings').message);
  //   }
  // });
});

describe('NgQubeeService custom config', () => {
  let service: NgQubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, {
              appends: 'app',
              fields: 'fld',
              filters: 'flt',
              includes: 'inc',
              limit: 'lmt',
              page: 'p',
              sort: 'srt'
            })
        }, NestService
      ]
    });

    service = TestBed.inject(NgQubeeService);
  });

  it('should generate a URI with fields (single model)', (done: DoneFn) => {
    service.addFields('users', ['email', 'name']);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('fld[users]=email,name');
      done();
    });
  });

  it('should generate a URI with filter', (done: DoneFn) => {
    service.addFilter('id', 1, 2, 3);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('flt[id]=1,2,3');
      done();
    });
  });

  it('should generate a URI with included models', (done: DoneFn) => {
    service.addIncludes('model1', 'model2');
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('inc=model1,model2');
      done();
    });
  });

  it('should generate a URI with a custom limit', (done: DoneFn) => {
    service.setModel('users');
    service.setLimit(25);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('lmt=25');
      done();
    });
  });

  it('should generate a URI with a custom page', (done: DoneFn) => {
    service.setModel('users');
    service.setPage(5);

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('p=5');
      done();
    });
  });

  it('should generate a URI with sorted field ASC', (done: DoneFn) => {
    service.addSort('f', SortEnum.ASC);
    service.setModel('users');

    service.generateUri().subscribe(uri => {
      expect(uri).toContain('srt=f');
      done();
    });
  });
});
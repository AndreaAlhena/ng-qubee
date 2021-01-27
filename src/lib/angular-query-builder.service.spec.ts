import { TestBed } from '@angular/core/testing';

import { AngularQueryBuilderService } from './angular-query-builder.service';

describe('AngularQueryBuilderService', () => {
  let service: AngularQueryBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularQueryBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

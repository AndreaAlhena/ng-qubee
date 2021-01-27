import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularQueryBuilderComponent } from './angular-query-builder.component';

describe('AngularQueryBuilderComponent', () => {
  let component: AngularQueryBuilderComponent;
  let fixture: ComponentFixture<AngularQueryBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularQueryBuilderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularQueryBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

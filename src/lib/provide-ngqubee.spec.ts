import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';

import { DriverEnum } from './enums/driver.enum';
import { IEnvironmentProviders } from './interfaces/environment-providers.interface';
import { provideNgQubee, provideNgQubeeInstance } from './provide-ngqubee';
import { NestService } from './services/nest.service';
import { NgQubeeService } from './services/ng-qubee.service';
import { PaginationService } from './services/pagination.service';
import {
  NG_QUBEE_DRIVER,
  NG_QUBEE_REQUEST_OPTIONS,
  NG_QUBEE_REQUEST_STRATEGY,
  NG_QUBEE_RESPONSE_OPTIONS,
  NG_QUBEE_RESPONSE_STRATEGY
} from './tokens/ng-qubee.tokens';

describe('provideNgQubee', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
    });
  });

  const providersOf = (driver: DriverEnum = DriverEnum.SPATIE): unknown[] =>
    (provideNgQubee({ driver }) as IEnvironmentProviders).ɵproviders.flat(Infinity);

  it('should provide NgQubeeService', () => {
    expect(providersOf()).toContain(NgQubeeService);
  });

  it('should provide PaginationService', () => {
    expect(providersOf()).toContain(PaginationService);
  });

  it('should provide NestService', () => {
    expect(providersOf()).toContain(NestService);
  });

  it('should provide the DI tokens for driver and strategies', () => {
    const provides = providersOf().map(p => (p as { provide?: unknown })?.provide);
    expect(provides).toContain(NG_QUBEE_DRIVER);
    expect(provides).toContain(NG_QUBEE_REQUEST_STRATEGY);
    expect(provides).toContain(NG_QUBEE_REQUEST_OPTIONS);
    expect(provides).toContain(NG_QUBEE_RESPONSE_STRATEGY);
    expect(provides).toContain(NG_QUBEE_RESPONSE_OPTIONS);
  });
});

describe('provideNgQubeeInstance', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
    });
  });

  it('should expose NestService, NgQubeeService, and PaginationService', () => {
    expect(provideNgQubeeInstance()).toEqual([NestService, NgQubeeService, PaginationService]);
  });

  it('should yield a dedicated NgQubeeService instance when used in a component injector', () => {
    @Component({
      selector: 'lib-dedicated',
      template: '',
      providers: [...provideNgQubeeInstance()]
    })
    class DedicatedComponent {
      constructor(public qb: NgQubeeService, public nest: NestService) {}
    }

    TestBed.configureTestingModule({
      imports: [BrowserTestingModule, DedicatedComponent],
      providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
    });

    const rootQb = TestBed.inject(NgQubeeService);
    const rootNest = TestBed.inject(NestService);

    const fixture = TestBed.createComponent(DedicatedComponent);
    const componentQb = fixture.componentInstance.qb;
    const componentNest = fixture.componentInstance.nest;

    expect(componentQb).not.toBe(rootQb);
    expect(componentNest).not.toBe(rootNest);
  });

  it('should isolate state between the root NgQubeeService and a component-scoped one', () => {
    @Component({
      selector: 'lib-isolated',
      template: '',
      providers: [...provideNgQubeeInstance()]
    })
    class IsolatedComponent {
      constructor(public qb: NgQubeeService) {}
    }

    TestBed.configureTestingModule({
      imports: [BrowserTestingModule, IsolatedComponent],
      providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
    });

    const rootQb = TestBed.inject(NgQubeeService);
    rootQb.setResource('root-resource').setLimit(50);

    const fixture = TestBed.createComponent(IsolatedComponent);
    const componentQb = fixture.componentInstance.qb;

    componentQb.setResource('component-resource').setLimit(10);

    rootQb.generateUri().subscribe(rootUri => {
      expect(rootUri).toContain('/root-resource');
      expect(rootUri).toContain('limit=50');
    });

    componentQb.generateUri().subscribe(componentUri => {
      expect(componentUri).toContain('/component-resource');
      expect(componentUri).toContain('limit=10');
    });
  });
});

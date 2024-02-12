import { EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNgQubee } from './provide-ngqubee';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { IEnvironmentProviders } from './interfaces/environment-providers.interface';

describe('provideNgQubee', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
    });
  });

  it('Providers should have NgQubeeService', () => {
    const providers = (provideNgQubee() as IEnvironmentProviders).ɵproviders.flatMap(obj => obj.provide.name);
    expect(providers).toContain('NgQubeeService');
  });

  it('Providers should have PaginationService', () => {
    const providers = (provideNgQubee() as IEnvironmentProviders).ɵproviders.flatMap(obj => obj.provide.name);
    expect(providers).toContain('PaginationService');
  });
  // it('should generate a URI', (done: DoneFn) => {
  //   service.setModel('users');

  //   service.generateUri().subscribe(uri => {
  //     expect(uri).toContain('/users');
  //     done();
  //   });
  // });
});

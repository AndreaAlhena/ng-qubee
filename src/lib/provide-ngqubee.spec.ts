import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';

import { DriverEnum } from './enums/driver.enum';
import { IEnvironmentProviders } from './interfaces/environment-providers.interface';
import { provideNgQubee } from './provide-ngqubee';

describe('provideNgQubee', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
    });
  });

  it('Providers should have NgQubeeService', () => {
    const providers = (provideNgQubee({ driver: DriverEnum.SPATIE }) as IEnvironmentProviders).ɵproviders.flatMap(obj => obj?.provide?.name);
    expect(providers).toContain('NgQubeeService');
  });

  it('Providers should have PaginationService', () => {
    const providers = (provideNgQubee({ driver: DriverEnum.SPATIE }) as IEnvironmentProviders).ɵproviders.flatMap(obj => obj?.provide?.name);
    expect(providers).toContain('PaginationService');
  });

  it('Providers should have NestService', () => {
    const providers = (provideNgQubee({ driver: DriverEnum.SPATIE }) as IEnvironmentProviders).ɵproviders.flatMap(obj => obj?.provide?.name);
    expect(providers).toContain('NestService');
  });
});

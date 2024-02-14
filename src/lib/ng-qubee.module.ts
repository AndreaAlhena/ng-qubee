import { ModuleWithProviders, NgModule } from '@angular/core';
import { NgQubeeService } from './ng-qubee.service';
import { IConfig } from './interfaces/config.interface';
import { PaginationService } from './services/pagination.service';
import { NestService } from './services/nest.service';

// @dynamic
@NgModule({
  providers: [{
    deps: [NestService],
    provide: NgQubeeService,
    useFactory: (nestService: NestService) => new NgQubeeService(nestService, {})
  }]
})
export class NgQubeeModule {
  public static forRoot(config: IConfig = {}): ModuleWithProviders<NgQubeeModule> {
    return {
      ngModule: NgQubeeModule,
      providers: [
        NestService,
        {
          deps: [NestService],
          provide: NgQubeeService,
          useFactory: (nestService: NestService) =>
            new NgQubeeService(nestService, Object.assign({}, config.request))
        }, {
          provide: PaginationService,
          useFactory: () =>
            new PaginationService(Object.assign({}, config.response))
        }
      ]
    };
  }
}

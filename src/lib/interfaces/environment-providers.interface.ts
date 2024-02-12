import { EnvironmentProviders } from "@angular/core";

export interface IEnvironmentProviders extends EnvironmentProviders {
    ɵproviders: {
        deps: Array<Object>,
        provide: Function,
        useFactory: Function
    }[]
}
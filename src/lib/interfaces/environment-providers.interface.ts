import { EnvironmentProviders } from "@angular/core";

export interface IEnvironmentProviders extends EnvironmentProviders {
    ɵproviders: {
        name: string,
        deps?: Array<Object>,
        provide?: Function,
        useFactory?: Function
    }[]
}
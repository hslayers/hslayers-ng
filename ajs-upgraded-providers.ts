import { HsMapService } from './components/map/map.service';
import { HsConfig } from './config.service';

export function hsMapServiceFactory(i: any) {
    return i.get('HsMapService');
}

export const HsMapServiceProvider = {
    provide: HsMapService,
    useFactory: hsMapServiceFactory,
    deps: ['$injector']
};

export function hsConfigFactory(i: any) {
    return i.get('HsConfig');
}


export const HsConfigProvider = {
    provide: HsConfig,
    useFactory: hsConfigFactory,
    deps: ['$injector']
};
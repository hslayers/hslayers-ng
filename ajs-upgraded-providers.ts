import { HsMapService } from './components/map/map.service';
import { HsConfig } from './config.service';
import { HsLayoutService } from './components/layout/layout.service';
import { HsUtilsService } from './components/utils/utils.service';

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

export function hsLayoutServiceFactory(i: any) {
    return i.get('HsLayoutService');
}

export const HsLayoutServiceProvider = {
    provide: HsLayoutService,
    useFactory: hsLayoutServiceFactory,
    deps: ['$injector']
};

export function hsUtilsServiceFactory(i: any) {
    return i.get('HsUtilsService');
}

export const HsUtilsServiceProvider = {
    provide: HsUtilsService,
    useFactory: hsUtilsServiceFactory,
    deps: ['$injector']
};
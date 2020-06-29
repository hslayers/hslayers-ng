import { HsMapService } from './components/map/map.service';
import { HsConfig } from './config.service';
import { HsLayoutService } from './components/layout/layout.service';
import { HsUtilsService } from './components/utils/utils.service';
import { HsDrawService } from './components/draw/draw.service.js';
import { HsStylerService } from './components/styles/styler.service';
import { HsLayerSynchronizerService } from './components/save-map/layer-synchronizer.service.js';
import { HsWmsGetCapabilitiesService } from './common/wms/get-capabilities.service.js';
import { HsWfsGetCapabilitiesService } from './common/wfs/get-capabilities.service.js';
import { HsWmtsGetCapabilitiesService } from './common/wmts/get-capabilities.service.js';

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

export function hsDrawServiceFactory(i: any) {
    return i.get('HsDrawService');
}

export const HsDrawServiceProvider = {
    provide: HsDrawService,
    useFactory: hsDrawServiceFactory,
    deps: ['$injector']
};

export function hsStylerServiceFactory(i: any) {
    return i.get('HsStylerService');
}

export const HsStylerServiceProvider = {
    provide: HsStylerService,
    useFactory: hsStylerServiceFactory,
    deps: ['$injector']
};

export function hsLayerSynchronizerServiceFactory(i: any) {
    return i.get('HsLayerSynchronizerService');
}

export const HsLayerSynchronizerServiceProvider = {
    provide: HsLayerSynchronizerService,
    useFactory: hsLayerSynchronizerServiceFactory,
    deps: ['$injector']
};

export function hsWmsGetCapabilitiesService(i: any) {
    return i.get('HsWmsGetCapabilitiesService');
}

export const HsWmsGetCapabilitiesServiceProvider = {
    provide: HsWmsGetCapabilitiesService,
    useFactory: hsWmsGetCapabilitiesService,
    deps: ['$injector']
};

export function hsWfsGetCapabilitiesService(i: any) {
    return i.get('HsWfsGetCapabilitiesService');
}

export const HsWfsGetCapabilitiesServiceProvider = {
    provide: HsWfsGetCapabilitiesService,
    useFactory: hsWfsGetCapabilitiesService,
    deps: ['$injector']
};

export function hsWmtsGetCapabilitiesService(i: any) {
    return i.get('HsWmtsGetCapabilitiesService');
}

export const HsWmtsGetCapabilitiesServiceProvider = {
    provide: HsWmtsGetCapabilitiesService,
    useFactory: hsWmtsGetCapabilitiesService,
    deps: ['$injector']
};

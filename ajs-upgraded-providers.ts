import {HsCommonEndpointsService} from './common/endpoints/endpoints.service';
import {HsCommonLaymanService} from './common/layman/layman.service';
import {HsCompositionsParserService} from './components/compositions/compositions-parser.service';
import {HsConfig} from './config.service';
import {HsDimensionService} from './common/dimension.service';
import {HsLayoutService} from './components/layout/layout.service';
import {HsMapService} from './components/map/map.service';
import {HsWfsGetCapabilitiesService} from './common/wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from './common/wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from './common/wmts/get-capabilities.service';

/**
 * @param i
 */
export function hsMapServiceFactory(i: any) {
  return i.get('HsMapService');
}

export const HsMapServiceProvider = {
  provide: HsMapService,
  useFactory: hsMapServiceFactory,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsConfigFactory(i: any) {
  return i.get('HsConfig');
}

export const HsConfigProvider = {
  provide: HsConfig,
  useFactory: hsConfigFactory,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsLayoutServiceFactory(i: any) {
  return i.get('HsLayoutService');
}

export const HsLayoutServiceProvider = {
  provide: HsLayoutService,
  useFactory: hsLayoutServiceFactory,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsWmsGetCapabilitiesService(i: any) {
  return i.get('HsWmsGetCapabilitiesService');
}

export const HsWmsGetCapabilitiesServiceProvider = {
  provide: HsWmsGetCapabilitiesService,
  useFactory: hsWmsGetCapabilitiesService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsWfsGetCapabilitiesService(i: any) {
  return i.get('HsWfsGetCapabilitiesService');
}

export const HsWfsGetCapabilitiesServiceProvider = {
  provide: HsWfsGetCapabilitiesService,
  useFactory: hsWfsGetCapabilitiesService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsWmtsGetCapabilitiesService(i: any) {
  return i.get('HsWmtsGetCapabilitiesService');
}

export const HsWmtsGetCapabilitiesServiceProvider = {
  provide: HsWmtsGetCapabilitiesService,
  useFactory: hsWmtsGetCapabilitiesService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsDimensionService(i: any) {
  return i.get('HsDimensionService');
}

export const HsDimensionServiceProvider = {
  provide: HsDimensionService,
  useFactory: hsDimensionService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsCommonEndpointsService(i: any) {
  return i.get('HsCommonEndpointsService');
}

export const HsCommonEndpointsServiceProvider = {
  provide: HsCommonEndpointsService,
  useFactory: hsCommonEndpointsService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsCommonLaymanService(i: any) {
  return i.get('HsCommonLaymanService');
}

export const HsCommonLaymanServiceProvider = {
  provide: HsCommonLaymanService,
  useFactory: hsCommonLaymanService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsCompositionsParserService(i: any) {
  return i.get('HsCompositionsParserService');
}

export const HsCompositionsParserServiceProvider = {
  provide: HsCompositionsParserService,
  useFactory: hsCompositionsParserService,
  deps: ['$injector'],
};

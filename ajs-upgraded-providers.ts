import {HsConfig} from './config.service';
import {HsDimensionService} from './common/dimension.service';
import {HsLayerSynchronizerService} from './components/save-map/layer-synchronizer.service';
import {HsLayerUtilsService} from './components/utils/layer-utils.service';
import {HsLayoutService} from './components/layout/layout.service';
import {HsMapService} from './components/map/map.service';
import {HsPermalinkUrlService} from './components/permalink/permalink-url.service';
import {HsQueryBaseService} from './components/query/query-base.service';
import {HsQueryVectorService} from './components/query/query-vector.service';
import {HsSidebarService} from './components/sidebar/sidebar.service';
import {HsUtilsService} from './components/utils/utils.service';
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
export function hsUtilsServiceFactory(i: any) {
  return i.get('HsUtilsService');
}

export const HsUtilsServiceProvider = {
  provide: HsUtilsService,
  useFactory: hsUtilsServiceFactory,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsLayerSynchronizerServiceFactory(i: any) {
  return i.get('HsLayerSynchronizerService');
}

export const HsLayerSynchronizerServiceProvider = {
  provide: HsLayerSynchronizerService,
  useFactory: hsLayerSynchronizerServiceFactory,
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
export function hsLayerUtilsServiceProvider(i: any) {
  return i.get('HsLayerUtilsService');
}

export const HsLayerUtilsServiceProvider = {
  provide: HsLayerUtilsService,
  useFactory: hsLayerUtilsServiceProvider,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsQueryBaseService(i: any) {
  return i.get('HsQueryBaseService');
}

export const HsQueryBaseServiceProvider = {
  provide: HsQueryBaseService,
  useFactory: hsQueryBaseService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsQueryVectorService(i: any) {
  return i.get('HsQueryVectorService');
}

export const HsQueryVectorServiceProvider = {
  provide: HsQueryVectorService,
  useFactory: hsQueryVectorService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsPermalinkUrlService(i: any) {
  return i.get('HsPermalinkUrlService');
}

export const HsPermalinkUrlServiceProvider = {
  provide: HsPermalinkUrlService,
  useFactory: hsPermalinkUrlService,
  deps: ['$injector'],
};

/**
 * @param i
 */
export function hsSidebarService(i: any) {
  return i.get('HsSidebarService');
}

export const HsSidebarServiceProvider = {
  provide: HsSidebarService,
  useFactory: hsSidebarService,
  deps: ['$injector'],
};

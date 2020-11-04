import {HsCommonEndpointsService} from './common/endpoints/endpoints.service';
import {HsConfig} from './config.service';
import {HsLayoutService} from './components/layout/layout.service';

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
export function hsCommonEndpointsService(i: any) {
  return i.get('HsCommonEndpointsService');
}

export const HsCommonEndpointsServiceProvider = {
  provide: HsCommonEndpointsService,
  useFactory: hsCommonEndpointsService,
  deps: ['$injector'],
};

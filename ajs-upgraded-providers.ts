import {HsCommonEndpointsService} from './common/endpoints/endpoints.service';
import {HsConfig} from './config.service';

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
export function hsCommonEndpointsService(i: any) {
  return i.get('HsCommonEndpointsService');
}

export const HsCommonEndpointsServiceProvider = {
  provide: HsCommonEndpointsService,
  useFactory: hsCommonEndpointsService,
  deps: ['$injector'],
};

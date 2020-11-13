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


import * as angular from 'angular';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsUtilsModule} from './utils.module';
import {HsUtilsService} from './utils.service';
import {downgrade} from '../../common/downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsUtilsModule);

/**
 * @namespace hs.utils * @memberOf hs
 */
angular
  .module(downgradedModule, [])

  .service('HsUtilsService', downgradeInjectable(HsUtilsService))
  .service('HsLayerUtilsService', downgradeInjectable(HsLayerUtilsService));

angular.module('hs.utils', [downgradedModule]);
export {HsUtilsModule} from './utils.module';

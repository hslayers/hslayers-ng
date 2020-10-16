import {HsCommonLaymanService} from './layman.service';
import {HsLaymanCurrentUserComponent} from './layman-current-user.component';
import {HsLaymanLoginComponent} from './layman-login.component';
import {HsLaymanModule} from './layman.module';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
export const downgradedModule = downgrade(HsLaymanModule);
import * as angular from 'angular';

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
angular
  .module(downgradedModule, [])

  /**
   * @name HsCommonLaymanService
   * @ngdoc service
   * @memberOf hs.common.layman
   * @description Service for common Layman functions
   */
  .service('HsCommonLaymanService', downgradeInjectable(HsCommonLaymanService))

  .directive(
    'hs.layman.currentUser',
    downgradeComponent({component: HsLaymanCurrentUserComponent})
  )

  .directive(
    'hs.laymanLogin',
    downgradeComponent({component: HsLaymanLoginComponent})
  );

angular.module('hs.common.layman', [downgradedModule]);

export {HsLaymanModule} from './layman.module';

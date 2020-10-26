import * as angular from 'angular';
import {HsCompositionsEndpointsModule} from './compositions-endpoints.module';
import {HsCompositionsLaymanService} from './compositions-layman.service';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsStatusManagerMickaJointService} from './status-manager-micka-joint.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {downgrade} from '../../../common/downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';
export const downgradedModule = downgrade(HsCompositionsEndpointsModule);

/**
 * @ngdoc module
 * @module hs.compositions.endpoints
 * @name hs.compositions.endpoints
 */
angular
  .module(downgradedModule, [])

  /**
   * @module HsCompositionsMickaService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Micka
   */
  .service(
    'HsCompositionsMickaService',
    downgradeInjectable(HsCompositionsMickaService)
  )

  /**
   * @module HsCompositionsLaymanService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Layman
   */
  .service(
    'HsCompositionsLaymanService',
    downgradeInjectable(HsCompositionsLaymanService)
  )

  /**
   * @module HsCompositionsStatusManagerService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for getting list of compositions from statusmanager.
   */
  .service(
    'HsCompositionsStatusManagerService',
    downgradeInjectable(HsCompositionsStatusManagerService)
  )

  /**
   * @module HsCompositionsStatusManagerMickaJointService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for getting list of compositions from statusmanager.
  Links together with mickaService to make micka compositions editable.
   */
  .service(
    'HsCompositionsStatusManagerMickaJointService',
    downgradeInjectable(HsCompositionsStatusManagerMickaJointService)
  );

angular.module('hs.compositions.endpoints', [downgradedModule]);

export {HsCompositionsEndpointsModule} from './compositions-endpoints.module';

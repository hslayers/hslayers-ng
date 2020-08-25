import * as angular from 'angular';
import {HsGeolocationComponent} from './geolocation.component';
import {HsGeolocationModule} from './geolocation.module';
import {HsGeolocationService} from './geolocation.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsGeolocationModule);

/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
angular
  .module(downgradedModule, ['hs.map'])
  /**
   * @memberof hs.geolocation
   * @ngdoc directive
   * @name hs.geolocation.directive
   * @description Add geolocation tracking panel html template to map, add event listeners through link
   */
  .directive(
    'hsGeolocation',
    downgradeComponent({component: HsGeolocationComponent})
  )

  /**
   * @memberof hs.geolocation
   * @ngdoc service
   * @name HsGeolocationService
   * @description Contains geolocation services, for mobile version through navigator.geolocation API, for classic version through OpenLayers ol.Geolocation class
   */
  .service('HsGeolocationService', downgradeInjectable(HsGeolocationService));

angular.module('hs.geolocation', [downgradedModule]);
export {HsGeolocationModule} from './geolocation.module';

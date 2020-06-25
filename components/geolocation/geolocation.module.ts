import geolocationDirective from './geolocation.directive';
import geolocationService from './geolocation.service';
import * as angular from 'angular';

/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
angular
  .module('hs.geolocation', ['hs.map'])
  /**
   * @memberof hs.geolocation
   * @ngdoc directive
   * @name hs.geolocation.directive
   * @description Add geolocation tracking panel html template to map, add event listeners through link
   */
  .directive('hs.geolocation.directive', geolocationDirective)

  /**
   * @memberof hs.geolocation
   * @ngdoc service
   * @name HsGeolocationService
   * @description Contains geolocation services, for mobile version through navigator.geolocation API, for classic version through OpenLayers ol.Geolocation class
   */
  .factory('HsGeolocationService', geolocationService);

import geolocationDirective from './geolocation.directive';
import geolocationService from './geolocation.service';
import geolocationController from './geolocation.controller';

/**
 * @namespace hs.geolocation
 * @memberOf hs
 */
angular.module('hs.geolocation', ['hs.map'])
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
    * @name hs.geolocation.service
    * @description Contains geolocation services, for mobile version through navigator.geolocation API, for classic version through OpenLayers ol.Geolocation class
    */
    .service('hs.geolocation.service', geolocationService)

    /**
    * @memberof hs.geolocation
    * @name hs.geolocation.controller
    * @ngdoc controller
    */
    .controller('hs.geolocation.controller', geolocationController);

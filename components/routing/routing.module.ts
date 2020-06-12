import * as angular from 'angular';
import {HsRoutingController} from './routing.controller';
/**
 * @namespace hs.routing
 * @memberOf hs
 */
angular
  .module('hs.routing', ['hs.map', 'hs.core'])

  /**
   * @memberof hs.routing
   * @ngdoc directive
   * @name hs.routing.directive
   * @description Add routing panel html template to the map
   */
  .directive('hs.routing.directive', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/routing.html'),
      };
    },
  ])

  /**
   * @memberof hs.routing
   * @ngdoc controller
   * @name HsRoutingController
   */
  .controller('HsRoutingController', HsRoutingController);


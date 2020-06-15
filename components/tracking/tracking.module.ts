import '../core/';
import * as angular from 'angular';
import TrackingController from './tracking.controller';
/**
 * @namespace hs.tracking
 * @memberOf hs
 * @param config
 */
angular
  .module('hs.tracking', ['hs.map', 'hs.core'])

  /**
   * @memberof hs.tracking
   * @ngdoc directive
   * @name hs.tracking.directive
   * @description Add tracking panel html template to the map
   */
  .directive('hs.tracking.directive', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/tracking.html'),
      };
    },
  ])

  /**
   * @memberof hs.tracking
   * @ngdoc controller
   * @name HsTrackingController
   */
  .controller(
    'HsTrackingController',
    TrackingController
  );

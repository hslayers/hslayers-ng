import 'focusIf';
import * as angular from 'angular';
import {HsTripPlannerController} from './trip-planner.controller';
import {HsTripPlannerService} from './trip-planner.service';
/**
 * @namespace hs.trip_planner
 * @memberOf hs
 * @param $scope
 * @param OlMap
 * @param HsCore
 * @param service
 * @param config
 * @param layoutService
 */
angular
  .module('hs.trip_planner', ['hs.map', 'hs.core', 'focus-if'])
  /**
   * @memberof hs.trip_planner
   * @ngdoc directive
   * @name hs.trip_planner.directive
   * @description Add trip planner panel html template to the map
   */
  .directive('hs.tripPlanner.directive', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/trip_planner.html'),
      };
    },
  ])

  /**
   * @memberof hs.trip_planner
   * @ngdoc service
   * @name HsTripPlannerService
   * @description Service managing trip planning functions - loading, adding, storing, removing waypoints and calculating route
   */
  .factory('HsTripPlannerService', HsTripPlannerService)

  /**
   * @memberof hs.trip_planner
   * @ngdoc directive
   * @name hs.tripPlanner.toolbarButtonDirective
   * @description Add trip planner button html template to the map
   */
  .directive('hs.tripPlanner.toolbarButtonDirective', () => {
    return {
      template: require('./partials/toolbar_button_directive.html'),
    };
  })

  /**
   * @memberof hs.trip_planner
   * @ngdoc controller
   * @name HsTripPlannerController
   */
  .controller('HsTripPlannerController', HsTripPlannerController);

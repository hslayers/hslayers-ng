import * as angular from 'angular';
import {HsTripPlannerComponent} from './trip-planner.component';
import {HsTripPlannerModule} from './trip-planner.module';
import {HsTripPlannerService} from './trip-planner.service';
import {HsTripPlannerToolbarButtonComponent} from './trip-planner-toolbar-button.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsTripPlannerModule);

/**
 * @namespace hs.trip_planner
 * @memberOf hs
 */

angular
  .module(downgradedModule, ['hs.map', 'hs.core'])
  /**
   * @memberof hs.trip_planner
   * @ngdoc component
   * @name hsTripPlannerComponent
   * @description Add trip planner panel html template to the map
   */
  .directive(
    'hsTripPlanner',
    downgradeComponent({component: HsTripPlannerComponent})
  )
  /**
   * @memberof hs.trip_planner
   * @ngdoc component
   * @name hsTripPlannerToolbarButtonComponent
   * @description Add trip planner button html template to the map
   */
  .directive(
    'hsTripPlannerToolbarButton',
    downgradeComponent({component: HsTripPlannerToolbarButtonComponent})
  )
  /**
   * @memberof hs.trip_planner
   * @ngdoc service
   * @name HsTripPlannerService
   * @description Service managing trip planning functions - loading, adding, storing, removing waypoints and calculating route
   */
  .service('HsTripPlannerService', downgradeInjectable(HsTripPlannerService));

angular.module('hs.trip_planner', [downgradedModule]);
export {HsTripPlannerModule} from './trip-planner.module';

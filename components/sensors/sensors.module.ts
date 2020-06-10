import sensorsComponent from './sensors.component';
import sensorsService from './sensors.service';
import sensorsUnitDialogComponent from './sensors-unit-dialog.component';
import sensorsUnitListItemComponent from './sensors-unit-list-item.component';
import * as angular from "angular";
import {downgradedLayoutModule} from '../layout';
/**
 * @namespace hs.sensors
 * @memberOf hs
 */
angular
  .module('hs.sensors', ['hs.map', 'hs.utils', downgradedLayoutModule, 'ui.bootstrap.datetimepicker'])

  /**
   * @memberof HsSensorsService
   * @ngdoc service
   * @name hs.sensors
   * @description Panel for listing of sensors
   */
  .factory('HsSensorsService', sensorsService)

  /**
   * @memberof hs.sensors.list
   * @ngdoc component
   * @name hs.sensors
   * @description Panel for listing of sensors
   */
  .component('hs.sensors.panel', sensorsComponent)

  /**
   * @memberof hs.sensors.unit
   * @ngdoc component
   * @name hs.sensors
   * @description Sensor unit item in list. Contains unit name and list of
   * sensors
   */
  .component('hs.sensors.unitListItem', sensorsUnitListItemComponent)

  /**
   * @memberof hs.sensors
   * @ngdoc component
   * @name hs.sensors.unitDialog
   * @description Dialog window showing list of sensors for unit and vega
   * charts for different date intervals
   */
  .component('hs.sensors.unitDialog', sensorsUnitDialogComponent);

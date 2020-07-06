/* eslint-disable angular/no-service-method */
import '../layout';
import * as angular from 'angular';
import {HsSensorsComponent} from './sensors.component';
import {HsSensorsModule} from './sensors.module';
import {HsSensorsService} from './sensors.service';
import {HsSensorsUnitDialogComponent} from './sensors-unit-dialog.component';
import {HsSensorsUnitListItemComponent} from './sensors-unit-list-item.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsSensorsModule);
/**
 * @namespace hs.sensors
 * @memberOf hs
 */
angular
  .module(downgradedModule, ['hs.map', 'hs.utils', 'hs.layout'])

  /**
   * @memberof HsSensorsService
   * @ngdoc service
   * @name hs.sensors
   * @description Panel for listing of sensors
   */
  .service('HsSensorsService', HsSensorsService)

  /**
   * @memberof hs.sensors.list
   * @ngdoc component
   * @name hs.sensors
   * @description Panel for listing of sensors
   */
  .directive('hs.sensors', downgradeComponent({component: HsSensorsComponent}))

  /**
   * @memberof hs.sensors.unit
   * @ngdoc component
   * @name hs.sensors
   * @description Sensor unit item in list. Contains unit name and list of
   * sensors
   */
  .directive(
    'hs.sensors.unitListItem',
    downgradeComponent({component: HsSensorsUnitListItemComponent})
  )

  /**
   * @memberof hs.sensors
   * @ngdoc component
   * @name hs.sensors.unitDialog
   * @description Dialog window showing list of sensors for unit and vega
   * charts for different date intervals
   */
  .directive(
    'hs.sensors.unitDialog',
    downgradeComponent({component: HsSensorsUnitDialogComponent})
  );

angular.module('hs.sensors', [downgradedModule]);

export {HsSensorsModule} from './sensors.module';

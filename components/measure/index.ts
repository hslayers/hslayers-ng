import '../layout';
import * as angular from 'angular';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureModule} from './measure.module';
import {HsMeasureService} from './measure.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedMeasureModule = downgrade(HsMeasureModule);
/**
 * @namespace hs.measure
 * @memberOf hs
 */
angular
  .module(downgradedMeasureModule, ['hs.map', 'hs.core', 'hs.layout'])
  /**
   * @memberof hs.measure
   * @ngdoc service
   * @name HsMeasureService
   */
  .service('HsMeasureService', downgradeInjectable(HsMeasureService))
  /**
   * @memberof hs.measure
   * @ngdoc component
   * @name hs.measure
   * @description Add measure html template of measuring distance or area to the map
   */
  .component('hs.measure', downgradeComponent({component: HsMeasureComponent}));

angular.module('hs.measure', [downgradedMeasureModule]);

export {HsMeasureModule} from './measure.module';

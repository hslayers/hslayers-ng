import '../layout';
import * as angular from 'angular';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureService} from './measure.service';

/**
 * @namespace hs.measure
 * @memberOf hs
 */
angular
  .module('hs.measure', ['hs.map', 'hs.core', 'hs.layout'])
  /**
   * @memberof hs.measure
   * @ngdoc service
   * @name HsMeasureService
   */
  .factory('HsMeasureService', HsMeasureService)
  /**
   * @memberof hs.measure
   * @ngdoc component
   * @name hs.measure
   * @description Add measure html template of measuring distance or area to the map
   */
  .component('hs.measure', HsMeasureComponent);

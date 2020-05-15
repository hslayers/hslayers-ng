import measureComponent from './measure.component';
import measureService from './measure.service';

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
  .factory('HsMeasureService', measureService)
  /**
   * @memberof hs.measure
   * @ngdoc component
   * @name hs.measure
   * @description Add measure html template of measuring distance or area to the map
   */
  .component('hs.measure', measureComponent);

import printComponent from './print.component';
import printService from './print.service';

/**
 * @namespace hs.print
 * @memberOf hs
 */

angular.module('hs.print', [])
  /**
   * @memberof hs.print
   * @ngdoc component
   * @name hs.print.component
   * @description Add print dialog template to the app
   */
  .component('hs.print', printComponent)
  /**
   * @memberof hs.print
   * @ngdoc service
   * @name hs.print.service
   */
  .factory('hs.print.service', printService);


import printComponent from "./print.component";
import printService from "./print.service";

/**
 * @namespace hs.print
 * @memberOf hs
 */

var module = angular.module('hs.print', []);

/**
 * @memberof hs.print
 * @ngdoc component
 * @name hs.print.component
 * @description Add print dialog template to the app
 */
module.component('hs.print', printComponent);

/**
 * @memberof hs.print
 * @ngdoc service
 * @name hs.print.service
 */
module.service('hs.print.service', printService);


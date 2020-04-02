import mickaService from './compositions-micka.service';
import statusManagerService from './compositions-status-manager.service';
import compositionsLaymanService from './compositions-layman.service';
import forCompositionFiter from './for-composition.fiter';

/**
 * @ngdoc module
 * @module hs.compositions.endpoints
 * @name hs.compositions.endpoints
 */
angular.module('hs.compositions.endpoints', [])

/**
* @module hs.compositions.mickaService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for gettign compositions from Micka
*/
  .factory('hs.compositions.mickaService', mickaService)

/**
* @module hs.compositions.laymanService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for gettign compositions from Layman
*/
  .factory('hs.compositions.laymanService', compositionsLaymanService)

/**
* @module hs.compositions.statusManagerService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for getting list of compositions from statusmanager.
Links together with mickaService to make micka compositions editable.
*/
  .factory('hs.compositions.statusManagerService', statusManagerService)

  .filter('forCompositions', forCompositionFiter);

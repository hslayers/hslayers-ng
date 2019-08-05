import mickaService from './compositions-micka.service';
import statusManagerService from './compositions-status-manager.service';

/**
 * @ngdoc module
 * @module hs.compositions.endpoints
 * @name hs.compositions.endpoints
 */
var module = angular.module('hs.compositions.endpoints', []);

/**
* @module hs.compositions.mickaService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for gettign compositions from micka
*/
module.service('hs.compositions.mickaService', mickaService)

/**
* @module hs.compositions.statusManagerService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for getting list of compositions from statusmanager. 
Links together with mickaService to make micka compositions editable.
*/
module.service('hs.compositions.statusManagerService', statusManagerService)

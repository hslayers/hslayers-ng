import mickaService from './compositions-micka.service';
import statusManagerService from './compositions-status-manager.service';
import compositionsLaymanService from './compositions-layman.service';

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
* @description Service for gettign compositions from Micka
*/
module.service('hs.compositions.mickaService', mickaService)

/**
* @module hs.compositions.laymanService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for gettign compositions from Layman
*/
module.service('hs.compositions.laymanService', compositionsLaymanService)

/**
* @module hs.compositions.statusManagerService
* @ngdoc service
* @name hs.compositions.endpoints
* @description Service for getting list of compositions from statusmanager. 
Links together with mickaService to make micka compositions editable.
*/
module.service('hs.compositions.statusManagerService', statusManagerService)

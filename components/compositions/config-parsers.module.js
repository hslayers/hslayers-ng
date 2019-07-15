import configParsersService from './config-parsers.service';
import 'angular-socialshare';

/**
 * @ngdoc module
 * @module hs.compositions.config_parsers
 * @name hs.compositions.config_parsers
 */
var module = angular.module('hs.compositions.config_parsers', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.addLayersVector']);

/**
* @module hs.compositions.config_parsers
* @ngdoc service
* @name hs.compositions.config_parsers.service
* @description Service for parsing object definition which are invalid for direct use as layers
*/
module.service('hs.compositions.config_parsers.service', configParsersService)

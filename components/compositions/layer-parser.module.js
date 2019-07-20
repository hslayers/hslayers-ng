import configParsersService from './layer-parser.service';
import 'angular-socialshare';

/**
 * @ngdoc module
 * @module hs.compositions.layerParser
 * @name hs.compositions.layerParser
 */
var module = angular.module('hs.compositions.layerParser', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.addLayersVector']);

/**
* @module hs.compositions.layerParserService
* @ngdoc service
* @name hs.compositions.layerParserService
* @description Service for parsing object definition which are invalid for direct use as layers
*/
module.service('hs.compositions.layerParserService', configParsersService)

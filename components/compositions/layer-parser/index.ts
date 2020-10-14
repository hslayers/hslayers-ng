import * as angular from 'angular';
import {HsCompositionsLayerParserService} from './layer-parser.service';

/**
 * @ngdoc module
 * @module hs.compositions.layerParser
 * @name hs.compositions.layerParser
 */
angular
  .module('hs.compositions.layerParser', [
    'hs.map',
    'hs.core',
    'hs.addLayersVector',
  ])

  /**
   * @module HsCompositionsLayerParserService
   * @ngdoc service
   * @name HsCompositionsLayerParserService
   * @description Service for parsing object definition which are invalid for direct use as layers
   */
  .service('HsCompositionsLayerParserService', HsCompositionsLayerParserService);

import * as angular from 'angular';
import {HsCompositionsLayerParserModule} from './layer-parser.module';
import {HsCompositionsLayerParserService} from './layer-parser.service';
import {downgrade} from '../../../common/downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';
export const downgradedModule = downgrade(HsCompositionsLayerParserModule);

/**
 * @ngdoc module
 * @module hs.compositions.layerParser
 * @name hs.compositions.layerParser
 */
angular
  .module(downgradedModule, ['hs.map', 'hs.core', 'hs.addLayersVector'])

  /**
   * @module HsCompositionsLayerParserService
   * @ngdoc service
   * @name HsCompositionsLayerParserService
   * @description Service for parsing object definition which are invalid for direct use as layers
   */
  .service(
    'HsCompositionsLayerParserService',
    downgradeInjectable(HsCompositionsLayerParserService)
  );

angular.module('hs.compositions.layerParser', []);

export {HsCompositionsLayerParserModule} from './layer-parser.module';

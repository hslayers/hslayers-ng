import '../../language';
import * as angular from 'angular';
import {HsAddLayersVectorComponent} from './add-layers-vector.component';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsVectorUrlParserService} from './add-layers-vector-url-parser.service';

/**
 * @param service
 * @param layoutService
 * @namespace hs.addLayersVector
 * @memberof hs
 */
angular
  .module('hs.addLayersVector', [
    'hs.styles',
    'hs.utils',
    'hs.language',
    'hs.layout',
    'hs.map'
  ])
  /**
   * @memberof hs.addLayersVector
   * @ngdoc directive
   * @name hs.addLayersVector
   * @description TODO
   */
  .component('hs.addLayersVector', HsAddLayersVectorComponent)

  /**
   * @memberof hs.addLayersVector
   * @ngdoc service
   * @name HsAddLayersVectorService
   * @description Service handling adding nonwms OWS services or files. Handles also drag and drop addition.
   */
  .service('HsAddLayersVectorService', HsAddLayersVectorService)

  /**
   * @memberof hs.addLayersVector
   * @ngdoc service
   * @name hs.ddLayersVectorUrlParser.service
   * @description Service handling loading of vector layers through url params
   */
  .factory('hs.addLayersVectorUrlParser.service', HsVectorUrlParserService);

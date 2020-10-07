import '../../language';
import * as angular from 'angular';
import addLayersVectorUrlParserService from './add-layers-vector-url-parser.service';
import {HsAddLayersVectorService} from './add-layers-vector.service';

/**
 * @param service
 * @param layoutService
 * @namespace hs.addLayersVector
 * @memberOf hs
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
   * @memberof hs.ows
   * @ngdoc directive
   * @name hs.addLayersVector
   * @description TODO
   */
  .directive('hs.addLayersVector', [
    function () {
      return {
        template: require('./add-vector-layer.directive.html'),
      };
    },
  ])

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
  .factory(
    'hs.addLayersVectorUrlParser.service',
    addLayersVectorUrlParserService
  )

  /**
   * @memberof hs.addLayersVector
   * @ngdoc controller
   * @name HsAddLayersVectorController
   */
  .controller('HsAddLayersVectorController', [
    'HsAddLayersVectorService',
    'HsLayoutService',
    function (service, layoutService) {
      const vm = this;
      vm.srs = 'EPSG:4326';
      vm.title = '';
      vm.extract_styles = false;

      /**
       * Handler for adding nonwms service, file in template.
       *
       * @memberof hs.addLayersVector.controller
       * @function add
       */
      vm.add = async function () {
        const layer = await service.addVectorLayer(
          '',
          vm.url,
          vm.title,
          vm.abstract,
          vm.srs,
          {extractStyles: vm.extract_styles}
        );
        service.fitExtent(layer);
        layoutService.setMainPanel('layermanager');
        return layer;
      };
    },
  ]);

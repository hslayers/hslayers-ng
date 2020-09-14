import '../../common/history-list';
import '../permalink';
import './arcgis/add-layers-arcgis.module';
import './shp/add-layers-shp.module';
import './vector/add-layers-vector.module';
import './wfs/add-layers-wfs.module';
import './wms/add-layers-wms.module';
import './wmts/add-layers-wmts.module';
import * as angular from 'angular';
import addLayersComponent from './add-layers.component';
import addLayersUrlDirective from './add-layers-url.directive';
import compileDirective from '../../common/compile.directive';
import dragDropLayerService from './drag-drop-layer.service';
import nestedLayersTableDirective from './nested-layers-table.directive';

/**
 * @namespace hs.addLayers
 * @memberof hs
 */
export const AddLayersModule = angular
  .module('hs.addLayers', [
    'hs.addLayersWms',
    'hs.addLayersArcgis',
    'hs.addLayersWfs',
    'hs.addLayersWmts',
    'hs.addLayersVector',
    'hs.addLayersShp',
    'hs.historyList',
    'hs.getCapabilities',
  ])
  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name compile
   * @description Directive which compiles a template and includes it in the dom.
   * Previously done with ng-bind-html which escaped variables and child directives
   */
  .directive('compile', compileDirective)

  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name hs.addLayersUrl
   */
  .directive('hs.addLayersUrl', addLayersUrlDirective)

  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name hs.addLayersUrl
   */
  .directive('hs.nestedLayersTable', nestedLayersTableDirective)

  /**
   * @memberof hs.addLayers
   * @ngdoc component
   * @name hs.addLayers
   */
  .component('hs.addLayers', addLayersComponent)

  .factory('HsDragDropLayerService', dragDropLayerService);

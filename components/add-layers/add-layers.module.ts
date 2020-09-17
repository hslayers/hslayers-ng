import '../../common/history-list';
import '../permalink';
import './arcgis/add-layers-arcgis.module';
import './shp/add-layers-shp.module';
import './vector/add-layers-vector.module';
import './wfs/add-layers-wfs.module';
import './wms/add-layers-wms.module';
import './wmts/add-layers-wmts.module';
import * as angular from 'angular';
import compileDirective from '../../common/compile.directive';
import {HsAddLayersComponent} from './add-layers.component';
import {HsAddLayersUrlComponent} from './add-layers-url.component';
import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsNestedLayersTableComponent} from './nested-layers-table.component';

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
    'ngCookies',
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
  .component('hs.addLayersUrl', HsAddLayersUrlComponent)

  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name hs.addLayersUrl
   */
  .component('hs.nestedLayersTable', HsNestedLayersTableComponent)

  /**
   * @memberof hs.addLayers
   * @ngdoc component
   * @name hs.addLayers
   */
  .component('hs.addLayers', HsAddLayersComponent)

  .factory('HsDragDropLayerService', HsDragDropLayerService);

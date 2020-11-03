import '../../common/history-list';
import '../map/';
import '../permalink';
import './arcgis/';
import './shp/';
import './vector/';
import './wfs/';
import './wms/';
import './wmts/';
import * as angular from 'angular';
import compileDirective from '../../common/compile.directive';
import {HsAddLayersComponent} from './add-layers.component';
import {HsAddLayersModule} from './add-layers.module';
import {HsAddLayersUrlComponent} from './add-layers-url.component';
import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsNestedLayersTableComponent} from './nested-layers-table.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedAddLayersModule = downgrade(HsAddLayersModule);

/**
 * @namespace hs.addLayers
 * @memberof hs
 */
angular
  .module(downgradedAddLayersModule, [
    'hs.map',
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
  .directive(
    'hs.addLayersUrl',
    downgradeComponent({component: HsAddLayersUrlComponent})
  )

  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name hs.addLayersUrl
   */
  .directive(
    'hs.nestedLayersTable',
    downgradeComponent({component: HsNestedLayersTableComponent})
  )

  /**
   * @memberof hs.addLayers
   * @ngdoc component
   * @name hs.addLayers
   */
  .component(
    'hs.addLayers',
    downgradeComponent({component: HsAddLayersComponent})
  )

  .service(
    'HsDragDropLayerService',
    downgradeInjectable(HsDragDropLayerService)
  );

angular.module('hs.addLayers', [downgradedAddLayersModule]);

export {HsAddLayersModule} from './add-layers.module';

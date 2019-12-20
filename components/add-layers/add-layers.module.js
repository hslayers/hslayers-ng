import '../permalink/permalink.module';
import '../map/map.module';
import compileDirective from '../../common/compile.directive';
import addLayersComponent from './add-layers.component';
import './wms/add-layers-wms.module';
import './arcgis/add-layers-arcgis.module';
import './wmts/add-layers-wmts.module';
import './wfs/add-layers-wfs.module';
import './vector/add-layers-vector.module';
import '../../common/history-list/history-list.module';
import addLayersUrlDirective from './add-layers-url.directive';
import nestedLayersTableDirective from './nested-layers-table.directive';

/**
 * @namespace hs.addLayers
 * @memberOf hs
 */
export const AddLayersModule = angular.module('hs.addLayers', ['hs.map', 'hs.addLayersWms', 'hs.addLayersArcgis', 'hs.addLayersWfs', 'hs.addLayersWmts', 'hs.addLayersVector', 'ngCookies', 'hs.historyList', 'hs.getCapabilities'])
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
   .directive('hs.nestedLayersTable', nestedLayersTableDirective )

    /**
    * @memberof hs.addLayers
    * @ngdoc component
    * @name hs.addLayers
    */
    .component('hs.addLayers', addLayersComponent);



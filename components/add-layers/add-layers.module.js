import '../permalink/permalink.module';
import '../map/map.module';
import compileDirective from '../../common/compile.directive';
import addLayersComponent from './add-layers.component';
import './add-layers-wms.module';
import './add-layers-wmts.module';
import './add-layers-wfs.module';
import './add-layers-vector.module';

/**
 * @namespace hs.addLayers
 * @memberOf hs
 */
export const AddLayersModule = angular.module('hs.addLayers', ['hs.map', 'hs.addLayersWms', 'hs.addLayersWfs', 'hs.addLayersWmts', 'hs.addLayersVector'])
    /**
    * @memberof hs.ows
    * @ngdoc directive
    * @name compile
    * @description Directive which compiles a template and includes it in the dom. 
    * Previously done with ng-bind-html which escaped variables and child directives
    */
    .directive('compile', compileDirective)

    /**
    * @memberof hs.ows
    * @ngdoc controller
    * @name hs.addLayers
    */
    .component('hs.addLayers', addLayersComponent);


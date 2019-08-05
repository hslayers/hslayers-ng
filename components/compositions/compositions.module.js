import compositionsService from 'compositions.service';
import parserService from 'compositions-parser.service';
import compositionsComponent from 'compositions.component';
import SparqlJson from 'hs.source.SparqlJson';
import 'components/utils/utils.module';
import 'angular-socialshare';
import './layer-parser.module';
import overwriteDialogDirective from './overwrite-dialog.directive';
import deleteDialogDirective from './delete-dialog.directive';
import shareDialogDirective from './share-dialog.directive';
import infoDialogDirective from './info-dialog.directive';
import './endpoints/compositions-endpoints.module';

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
var module = angular.module('hs.compositions', ['720kb.socialshare', 'hs.map', 
     'hs.core', 'hs.compositions.layerParser', 'hs.compositions.endpoints'])   
    /**
     * @module hs.compositions
     * @name hs.compositions.overwriteDialogDirective
     * @ngdoc directive
     * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition 
     */
    .directive('hs.compositions.overwriteDialogDirective', overwriteDialogDirective)

    /**
     * @module hs.compositions
     * @name hs.compositions.deleteDialogDirective
     * @ngdoc directive
     * @description Display dialog window for confiriming deletion of selected composition
     */
    .directive('hs.compositions.deleteDialogDirective', deleteDialogDirective)

    /**
     * @module hs.compositions
     * @name hs.compositions.shareDialogDirective
     * @ngdoc directive
     * @description Display dialog of sharing composition (URL / Social networks)
     */
    .directive('hs.compositions.shareDialogDirective', shareDialogDirective)
    
    /**
     * @module hs.compositions
     * @name hs.compositions.infoDialogDirective
     * @ngdoc directive
     * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
     */
    .directive('hs.compositions.infoDialogDirective', infoDialogDirective)

    /**
     * @module hs.compositions
     * @name hs.compositions.service
     * @ngdoc controller
     * @description Service of composition module
     */
    .service('hs.compositions.service', compositionsService)

    /**
     * @module hs.compositions
     * @name hs.compositions.service_parser
     * @ngdoc service
     * @description Contains function of managing composition (loading, removing Layers)
     */
    .service('hs.compositions.service_parser', parserService)

    /**
     * @module hs.compositions
     * @name hs.compositions
     * @ngdoc component
     * @description Main controller of composition module
     */
    .component('hs.compositions', compositionsComponent)

import layerlistDirective from './layermanager-layerlist.directive';
import 'components/utils/utils.module';
import 'angular-drag-and-drop-lists';
import 'components/save-map/save-map.module';
import 'components/styles/styles.module';
import 'components/legend/legend.module';
import layermanagerWmstService from './layermanager-wmst.service';
import layermanagerService from './layermanager.service';
import folderDirective from './layermanager-folder.directive';
import removeAllDialogDirective from './remove-all-dialog.directive';
import layermanagerComponent from './layermanager.component';
import 'common/get-capabilities.module'
import layerEditorComponent from './layer-editor.component';
import layermanagerGalleryDirective from './layermanager-gallery.directive';
import layerEditorSubLayerCheckboxesDirective from './layer-editor.sub-layer-checkboxes.directive';
import layerEditorSubLayerService from './layer-editor.sub-layer.service';
import layerEditorVectorLayerService from './layer-editor-vector-layer.service';

/**
 * @ngdoc module
 * @module hs.layermanager
 * @name hs.layermanager
 * @description Layer manager module maintain management of layers loaded in HS Layers application. It use folder structure to enable building hiearchy of layers. All layers are wrapped inside HSLayer object, which contain auxilary informations and layer itself.
 */
angular.module('hs.layermanager', ['hs.map', 'hs.utils', 'dndLists', 'hs.save-map', 'hs.styles', 'hs.legend', 'hs.getCapabilities'])
    // .directive('hs.baselayers.directive', function() {
    //     return {
    //         template: require('components/layermanager/partials/baselayers.html')
    //     }
    // })


    /**
     * @module hs.layermanager
     * @name hs.layermanager.removeAllDialogDirective
     * @ngdoc directive
     * @description Display warning dialog (modal) about removing all layers, in 
     * default opened when remove all layers function is used. Have option to 
     * remove all active layers, reload default composition of app or to cancel 
     * action.
     * When used in current version of HS Layers, it is recommended to append 
     * this modal directive to #hs-dialog-area element and compile scope.
     * Example
        * ```
        * var el = angular.element('<div hs.layermanager.remove_all_dialog_directive></div>');
        * document.getElementById("hs-dialog-area").appendChild(el[0]);
        * $compile(el)($scope);
        * ```
     */
    .directive('hs.layermanager.removeAllDialogDirective', removeAllDialogDirective)

    /**
     * @module hs.layermanager
     * @name hs.layermanager.layerlistDirective
     * @ngdoc directive
     * @description Directive for displaying list of layers in default HSLayers 
     * manager template. Every directive instance contain one folder of 
     * folder stucture. For every layer displays current information notes and 
     * on click opens layer options panel. Every directive instance is 
     * automatically refresh when layermanager.updated fires. Directive has 
     * access to contollers data object.
     */
    .directive('hs.layermanager.layerlistDirective', layerlistDirective)

    /**
     * @module hs.layermanager
     * @name hs.layermanager.WMSTservice
     * @ngdoc service
     * @description Service for management of time (WMS) layers
     */
    .service("hs.layermanager.WMSTservice", layermanagerWmstService)

    /**
     * @module hs.layermanager
     * @name hs.layermanager.service
     * @ngdoc service
     * @description Service for core layers management. Maintain layer management 
     * structures and connect layer manager with map.Automatically update 
     * manager when layer is added or removed from map.
     */
    .service("hs.layermanager.service", layermanagerService)

    /**
     * @module hs.layermanager
     * @name hs.layermanager.folderDirective
     * @ngdoc directive
     * @description Directive for displaying folder structure for grouping lists 
     * of layers Used recursively to build full folder structure if it is created 
     * in layer manager. Single instance shows layers and subfolders of its 
     * position in folder structure.
     */
    .directive('hs.layermanager.folderDirective', folderDirective)

    /**
     * @module hs.layermanager
     * @name hs.layermanager
     * @ngdoc component
     * @description Layer manager panel. Contains filter, baselayers, overlay 
     * container and settings panel for active layer.
     */
    .component('hs.layermanager', layermanagerComponent)

        /**
     * @module hs.layerEditor
     * @name hs.layer-editor
     * @ngdoc component
     * @description Panel for editing selected layer parameters
     */
    .component('hs.layerEditor', layerEditorComponent)
         /**
     * @module hs.layerEditor
     * @name hs.layer-editor
     * @ngdoc service
     * @description Service for layer editor management.
     * manages layer clustering and decluttering
     */
    .service('hs.layerEditorVectorLayer.service', layerEditorVectorLayerService)

     /**
     * @module hs.layermanager
     * @name hs.layermanager.gallery
     * @ngdoc component
     * @description Panel for editing selected layer parameters
     */
    .directive('hs.layermanager.gallery', layermanagerGalleryDirective)
    
     /**
     * @module hs.layermanager
     * @name hs.layerEditor.sublayerCheckbox
     * @ngdoc directive
     * @description List of checkboxes for sub-layer ticking
     */
    .directive('hs.layerEditor.sublayerCheckbox', layerEditorSubLayerCheckboxesDirective)
    .service('hs.layerEditor.sublayerService',layerEditorSubLayerService)
    ;



import '../../common/get-capabilities.module';
import '../draw/draw.module';
import '../layout/';
import '../legend';
import '../save-map/';
import '../styles/styles.module';
import '../utils';
import 'angular-drag-and-drop-lists';
import * as angular from 'angular';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorDimensionsComponent} from './dimensions/layer-editor-dimensions.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSubLayerCheckboxesComponent} from './layer-editor.sub-layer-checkboxes.component';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerListComponent} from './layermanager-layerlist.component';
import {HsLayerManagerComponent} from './layermanager.component';
import {HsLayerManagerFolderComponent} from './layermanager-folder.component';
import {HsLayerManagerGalleryComponent} from './layermanager-gallery.component';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerModule} from './layermanager.module';
import {HsLayerManagerRemoveAllDialogComponent} from './remove-all-dialog.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedLayerManagerModule = downgrade(HsLayerManagerModule);
/**
 * @namespace hs.layermanager
 * @memberOf hs
 */

/**
 * @ngdoc module
 * @module hs.layermanager
 * @name hs.layermanager
 * @description Layer manager module maintain management of layers loaded in HS Layers application. It use folder structure to enable building hiearchy of layers. All layers are wrapped inside HSLayer object, which contain auxilary information and layer itself.
 */
angular
  .module(downgradedLayerManagerModule, [
    'hs.map',
    'hs.utils',
    'dndLists',
    'hs.save-map',
    'hs.styles',
    'hs.legend',
    'hs.getCapabilities',
    'hs.draw',
    'hs.layout',
  ])
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
   * layoutService.contentWrapper.querySelector(".hs-dialog-area").appendChild(el[0]);
   * $compile(el)($scope);
   * ```
   */
  .directive(
    'hs.layermanager.removeAllDialogDirective',
    downgradeComponent({component: HsLayerManagerRemoveAllDialogComponent})
  )

  /**
   * @module hs.layermanager
   * @name hs.layermanager.layerlistDirective
   * @ngdoc directive
   * @description Directive for displaying list of layers in default HSLayers
   * manager template. Every directive instance contain one folder of
   * folder structure. For every layer displays current information notes and
   * on click opens layer options panel. Every directive instance is
   * automatically refresh when HsEventBusService.layerManagerUpdates.next fires. Directive has
   * access to controllers data object.
   */
  .directive(
    'hs.layermanager.layerlistDirective',
    downgradeComponent({component: HsLayerListComponent})
  )

  /**
   * @module hs.layermanager
   * @name HsLayermanagerWmstService
   * @ngdoc service
   * @description Service for management of time (WMS) layers
   */
  .service(
    'HsLayermanagerWmstService',
    downgradeInjectable(HsLayerManagerWmstService)
  )

  /**
   * @module hs.layermanager
   * @name HsLayermanagerService
   * @ngdoc service
   * @description Service for core layers management. Maintain layer management
   * structures and connect layer manager with map.Automatically update
   * manager when layer is added or removed from map.
   */
  .service('HsLayermanagerService', downgradeInjectable(HsLayerManagerService))

  /**
   * @module hs.layermanager
   * @name HsLayermanagerWmstService
   * @ngdoc service
   * @description Manage layer´s metadata through getCapabilities request calls and responses
   */
  .service(
    'HsLayermanagerMetadata',
    downgradeInjectable(HsLayerManagerMetadataService)
  )

  /**
   * @module hs.layermanager
   * @name hs.layermanager.folderDirective
   * @ngdoc directive
   * @description Directive for displaying folder structure for grouping lists
   * of layers Used recursively to build full folder structure if it is created
   * in layer manager. Single instance shows layers and subfolders of its
   * position in folder structure.
   */
  .directive(
    'hs.layermanager.folderDirective',
    downgradeComponent({component: HsLayerManagerFolderComponent})
  )

  /**
   * @module hs.layermanager
   * @name hs.layermanager
   * @ngdoc component
   * @description Layer manager panel. Contains filter, baselayers, overlay
   * container and settings panel for active layer.
   */
  .directive(
    'hs.layermanager',
    downgradeComponent({component: HsLayerManagerComponent})
  )

  /**
   * @module hs.layerEditor
   * @name hs.layer-editor
   * @ngdoc component
   * @description Panel for editing selected layer parameters
   */
  .directive(
    'hs.layerEditor',
    downgradeComponent({component: HsLayerEditorComponent})
  )

  /**
   * @module hs.layerEditor
   * @name hs.layer-editor
   * @ngdoc service
   * @description Service for vector layer management.
   */
  .service(
    'HsLayerEditorVectorLayerService',
    downgradeInjectable(HsLayerEditorVectorLayerService)
  )

  /**
   * @module hs.layerEditor
   * @name hs.layer-editor.service
   * @ngdoc service
   * @description Service for layer editor.
   */
  .service('HsLayerEditorService', downgradeInjectable(HsLayerEditorService))

  /**
   * @module hs.layermanager
   * @name hs.layermanager.gallery
   * @ngdoc component
   * @description Panel for editing selected layer parameters
   */
  .directive(
    'hs.layermanager.gallery',
    downgradeComponent({component: HsLayerManagerGalleryComponent})
  )

  /**
   * @module hs.layermanager
   * @name hs.layerEditor.sublayerCheckbox
   * @ngdoc directive
   * @description List of checkboxes for sub-layer ticking
   */
  .directive(
    'hs.layerEditor.sublayerCheckbox',
    downgradeComponent({component: HsLayerEditorSubLayerCheckboxesComponent})
  )
  .service(
    'HsLayerEditorSublayerService',
    downgradeInjectable(HsLayerEditorSublayerService)
  )
  .directive(
    'hs.layerEditorDimensions',
    downgradeComponent({component: HsLayerEditorDimensionsComponent})
  )
  .service(
    'HsLayerSelectorService',
    downgradeInjectable(HsLayerSelectorService)
  )

angular.module('hs.layermanager', [downgradedLayerManagerModule]);

export * from './layermanager.service';
export {HsLayerManagerModule} from './layermanager.module';

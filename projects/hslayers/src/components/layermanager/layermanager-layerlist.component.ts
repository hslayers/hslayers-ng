import BaseLayer from 'ol/layer/Base';
import {Component, Input} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';

@Component({
  selector: 'hs-layermanager-layer-list',
  templateUrl: './partials/layerlist.html',
})
export class HsLayerListComponent {
  @Input() folder: any;
  /**
   * @ngdoc property
   * @name hs.layermanager.layerlistDirective#layer_titles
   * @public
   * @type {Array}
   * @description List of layer titles for current folder structure level. List is always ordered in order which should be used in template.
   */
  layer_titles: Array<any> = [];
  filtered_layers: Array<any> = [];

  constructor(
    public HsConfig: HsConfig,
    public HsLayerManagerService: HsLayerManagerService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.HsEventBusService.layerManagerUpdates.subscribe(() => {
      this.sortLayersByPosition();
    });
  }
  /**
   * @function layerLoaded
   * @memberOf hs.layermanager-layerlist
   * @param {Layer} layer Selected layer
   * @description Test if selected layer is loaded in map
   */
  layerLoaded(layer: Layer): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  changeSublayerVisibilityState(layer, state) {
    if (layer.layer.checkedSubLayers) {
      Object.keys(layer.layer.checkedSubLayers).forEach((key) => {
        layer.layer.checkedSubLayers[key] = state;
      });
    }
    if (layer.layer.withChildren) {
      Object.keys(layer.layer.withChildren).forEach((key) => {
        layer.layer.withChildren[key] = state;
      });
    }
  }

  /**
   * @function layerValid
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @returns
   * @description Test if selected layer is valid (true for invalid)
   */
  layerValid(layer) {
    return this.HsLayerUtilsService.layerInvalid(layer);
  }

  /**
   * @function toggleSublayersVisibility
   * @memberOf hs.layermanager.layerlist
   * @description Controls state of layer´s sublayers checkboxes with layer visibility changes
   * @param {object} layer Selected layer
   */
  toggleSublayersVisibility(layer: HsLayerDescriptor) {
    if (!layer.visible) {
      if (this.HsLayerManagerService.currentLayer === layer) {
        if (this.HsLayerEditorSublayerService.hasSubLayers()) {
          this.changeSublayerVisibilityState(
            layer,
            this.HsLayerManagerService.currentLayer.visible
          );
        }
      } else {
        this.changeSublayerVisibilityState(layer, layer.visible);
      }
    } else {
      if (layer.layer.checkedSubLayers) {
        Object.keys(layer.layer.checkedSubLayers).forEach((key) => {
          layer.layer.checkedSubLayers[key] =
            layer.layer.checkedSubLayersTmp[key];
        });
      }
      if (layer.layer.withChildren) {
        Object.keys(layer.layer.withChildren).forEach((key) => {
          layer.layer.withChildren[key] = layer.layer.withChildrenTmp[key];
        });
      }
    }
  }
  ngOnInit() {
    /**
     * @ngdoc property
     * @name hs.layermanager.layerlistDirective#filtered_layers
     * @public
     * @type {Array}
     * @description List of layers which belong to folder hierarchy level of directive instance
     */
    this.filtered_layers = this.filterLayers();
    this.sortLayersByPosition();
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#filterLayers
   * @private
   * @description Filters layers, and returns only the ones belonging to folder hiearchy level of directive
   */
  filterLayers() {
    const tmp = [];

    for (const layer of this.HsLayerManagerService.data.layers) {
      if (
        layer.layer.get('path') == this.folder.hsl_path ||
        ((layer.layer.get('path') == undefined ||
          layer.layer.get('path') == '') &&
          this.folder.hsl_path == '')
      ) {
        tmp.push(layer);
      }
    }
    return tmp;
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#filtered_layers
   * @public
   * @description Generate list of layer titles out of {@link hs.layermanager.layerlistDirective#filtered_layers filtered_layers}. Complex layer objects cant be used because DragDropList functionality can handle only simple structures.
   */
  generateLayerTitlesArray() {
    this.layer_titles = [];
    for (let i = 0; i < this.filtered_layers.length; i++) {
      this.layer_titles.push(this.filtered_layers[i].title);
    }
  }



  /**
   * @function isLayerQueryable
   * @memberOf hs.layermanager.controller
   * @param {object} layer_container Selected layer - wrapped in layer object
   * @description Test if layer is queryable (WMS layer with Info format)
   */
  isLayerQueryable(layer_container): boolean {
    return this.HsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#sortLayersByPosition
   * @private
   * @description Sort layers by computed position
   */
  sortLayersByPosition(): void {
    this.filtered_layers = this.filterLayers();
    this.filtered_layers = this.HsLayerManagerService.sortLayersByValue(
      this.filtered_layers
    );
    this.generateLayerTitlesArray();
  }
}

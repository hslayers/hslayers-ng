import {Component, Input, OnInit} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';
import {getDimension, getHsLaymanSynchronizing, getPath} from '../../common/layer-extensions';

@Component({
  selector: 'hs-layermanager-layer-list',
  templateUrl: './partials/layerlist.html',
})
export class HsLayerListComponent implements OnInit {
  @Input() folder: any;
  /**
   * List of layer titles for current folder structure level. List is always ordered in order which should be used in template.
   * @public
   */
  layer_titles: Array<any> = [];
  /**
   * List of layers which belong to folder hierarchy level of directive instance
   */
  filtered_layers: Array<any> = [];
  getHsLaymanSynchronizing = getHsLaymanSynchronizing;
  constructor(
    public HsConfig: HsConfig,
    public HsLayerManagerService: HsLayerManagerService,
    public hsLayerManagerWmstService: HsLayerManagerWmstService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.HsEventBusService.layerManagerUpdates.subscribe(() => {
      this.HsLayerManagerService.updateLayerListPositions();
      this.updateLayers();
    });
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: Layer): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  changeSublayerVisibilityState(layer, state): void {
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
   * Test if selected layer is valid (true for invalid)
   * @param layer - Selected layer
   * @returns
   */
  layerValid(layer) {
    return this.HsLayerUtilsService.layerInvalid(layer);
  }

  /**
   * Controls state of layer's sublayers checkboxes with layer visibility changes
   * @param layer - Selected layer
   */
  toggleSublayersVisibility(layer: HsLayerDescriptor): void {
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

  ngOnInit(): void {
    this.filtered_layers = this.filterLayers();
  }

  /**
   * Filters layers, and returns only the ones belonging to folder hiearchy level of directive
   * @private
   */
  private filterLayers(): Array<any> {
    const tmp = [];

    for (const layer of this.HsLayerManagerService.data.layers) {
      if (
        getPath(layer.layer) == this.folder.hsl_path ||
        ((getPath(layer.layer) == undefined || getPath(layer.layer) == '') &&
          this.folder.hsl_path == '')
      ) {
        tmp.push(layer);
      }
    }
    return tmp;
  }

  /**
   * Generate list of layer titles out of {@link hs.layermanager.layerlistDirective#filtered_layers filtered_layers}. Complex layer objects can't be used because DragDropList functionality can handle only simple structures.
   * @public
   */
  generateLayerTitlesArray(): void {
    this.layer_titles = [];
    for (let i = 0; i < this.filtered_layers.length; i++) {
      this.layer_titles.push(this.filtered_layers[i].title);
    }
  }

  /**
   * Test if layer is queryable (WMS layer with Info format)
   * @param layer_container - Selected layer - wrapped in layer object
   */
  isLayerQueryable(layer_container): boolean {
    return this.HsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }

  showLayerWmsT(layer: HsLayerDescriptor): boolean {
    return (
      this.hsLayerManagerWmstService.layerIsWmsT(layer) &&
      !getDimension(layer.layer, 'time')?.disabled
    );
  }

  /**
   * Update layers list
   * @private
   */
  private updateLayers(): void {
    this.filtered_layers = this.filterLayers();
    this.generateLayerTitlesArray();
  }
}

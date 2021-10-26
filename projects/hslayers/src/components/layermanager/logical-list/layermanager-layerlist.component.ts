import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {
  getDimension,
  getExclusive,
  getHsLaymanSynchronizing,
  getPath,
} from '../../../common/layer-extensions';

import {HsConfig} from '../../../config.service';
import {HsDimensionTimeService} from '../../../common/get-capabilities/dimension-time.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerEditorSublayerService} from '../editor/layer-editor.sub-layer.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-layermanager-layer-list',
  templateUrl: './layerlist.html',
})
export class HsLayerListComponent implements OnInit, OnDestroy {
  @Input() folder: any;
  /**
   * List of layer titles for current folder structure level. List is always ordered in order which should be used in template.
   * @public
   */
  layer_titles: Array<string> = [];
  /**
   * List of layers which belong to folder hierarchy level of directive instance
   */
  filtered_layers: Array<HsLayerDescriptor> = [];
  getHsLaymanSynchronizing = getHsLaymanSynchronizing;
  getExclusive = getExclusive;
  layerManagerUpdatesSubscription: Subscription;
  constructor(
    public HsConfig: HsConfig,
    public HsLayerManagerService: HsLayerManagerService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.layerManagerUpdatesSubscription =
      this.HsEventBusService.layerManagerUpdates.subscribe(() => {
        this.HsLayerManagerService.updateLayerListPositions();
        this.updateLayers();
      });
  }
  ngOnDestroy(): void {
    this.layerManagerUpdatesSubscription.unsubscribe();
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  changeSublayerVisibilityState(layer: HsLayerDescriptor, state): void {
    if (layer.checkedSubLayers) {
      Object.keys(layer.checkedSubLayers).forEach((key) => {
        layer.checkedSubLayers[key] = state;
      });
    }
    if (layer.withChildren) {
      Object.keys(layer.withChildren).forEach((key) => {
        layer.withChildren[key] = state;
      });
    }
  }

  /**
   * Test if selected layer is valid
   * @param layer - Selected layer
   * @returns true for invalid layer
   */
  layerValid(layer: HsLayerDescriptor): boolean {
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
      if (layer.checkedSubLayers) {
        Object.keys(layer.checkedSubLayers).forEach((key) => {
          layer.checkedSubLayers[key] = layer.checkedSubLayersTmp[key];
        });
      }
      if (layer.withChildren) {
        Object.keys(layer.withChildren).forEach((key) => {
          layer.withChildren[key] = layer.withChildrenTmp[key];
        });
      }
    }
  }

  ngOnInit(): void {
    this.filtered_layers = this.filterLayers();
  }

  layerFilter = (item): boolean => {
    const r = new RegExp(this.HsLayerManagerService.data.filter, 'i');
    return r.test(item.title);
  };

  /**
   * Filters layers, and returns only the ones belonging to folder hierarchy level of directive
   * @private
   * @returns {Array<HsLayerDescriptor>} Filtered HsLayerManagerService layers
   */
  private filterLayers(): Array<HsLayerDescriptor> {
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
  isLayerQueryable(layer_container: HsLayerDescriptor): boolean {
    return this.HsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }

  showLayerWmsT(layer: HsLayerDescriptor): boolean {
    return (
      this.hsDimensionTimeService.layerIsWmsT(layer) &&
      !getDimension(layer.layer, 'time')?.onlyInEditor
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

import {Injectable} from '@angular/core';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorSublayerService} from '../editor/layer-editor-sub-layer.service';
import {
  HsLayerManagerService,
  HsLayerSelectorService,
} from 'hslayers-ng/shared/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {getPath} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerListService {
  constructor(
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsLayerSelectorService: HsLayerSelectorService,
  ) {}

  /**
   * Controls state of layer's sublayers checkboxes with layer visibility changes
   * @param layer - Selected layer
   */
  toggleSublayersVisibility(layer: HsLayerDescriptor): void {
    if (!layer.visible) {
      if (this.hsLayerSelectorService.currentLayer === layer) {
        if (this.hsLayerEditorSublayerService.hasSubLayers()) {
          this.changeSublayerVisibilityState(
            layer,
            this.hsLayerSelectorService.currentLayer.visible,
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

  /**
   * Filters layers, and returns only the ones belonging to folder hierarchy level of directive
   * @returns Filtered HsLayerManagerService layers
   */
  filterLayers(folder): Array<HsLayerDescriptor> {
    const tmp = [];
    for (const layer of this.hsLayerManagerService.data.layers) {
      if (
        getPath(layer.layer) == folder.hsl_path ||
        ((getPath(layer.layer) == undefined || getPath(layer.layer) == '') &&
          folder.hsl_path == '')
      ) {
        tmp.push(layer);
      }
    }
    return tmp;
  }

  private changeSublayerVisibilityState(layer: HsLayerDescriptor, state): void {
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
   * Test if layer is queryable (WMS layer with Info format)
   * @param layer_container - Selected layer - wrapped in layer object
   */
  isLayerQueryable(layer_container: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }
}

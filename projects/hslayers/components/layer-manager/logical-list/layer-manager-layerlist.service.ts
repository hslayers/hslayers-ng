import {Injectable} from '@angular/core';

import {HsLayerDescriptor, HsSublayer} from 'hslayers-ng/types';
import {HsLayerEditorSublayerService} from '../editor/sublayers/layer-editor-sub-layer.service';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsLayerListService {
  constructor(
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public hsLayerUtilsService: HsLayerUtilsService,
  ) {}

  /**
   * Controls state of layer's sublayers checkboxes with layer visibility changes
   * @param layer - Selected layer
   */
  toggleSublayersVisibility(layer: HsLayerDescriptor): void {
    if (layer._sublayers) {
      if (!layer.visible) {
        this.updateSublayersVisibility(layer._sublayers, false);
      } else {
        this.restoreSublayersVisibility(layer._sublayers);
      }
    }
  }

  /**
   * Recursively updates the visibility of sublayers and stores their previous visibility state
   * @param sublayers - Array of sublayers to update
   * @param visible - The new visibility state to set
   */
  private updateSublayersVisibility(
    sublayers: HsSublayer[],
    visible: boolean,
  ): void {
    sublayers.forEach((sublayer) => {
      sublayer.previousVisible = sublayer.visible;
      sublayer.visible = visible;
      if (sublayer.sublayers) {
        this.updateSublayersVisibility(sublayer.sublayers, visible);
      }
    });
  }

  /**
   * Recursively restores the visibility of sublayers based on their previous visibility state
   * @param sublayers - Array of sublayers to restore
   */
  private restoreSublayersVisibility(sublayers: HsSublayer[]): void {
    sublayers.forEach((sublayer) => {
      sublayer.visible = sublayer.previousVisible ?? true;
      if (sublayer.sublayers) {
        this.restoreSublayersVisibility(sublayer.sublayers);
      }
    });
  }

  /**
   * Test if layer is queryable (WMS layer with Info format)
   * @param layer_container - Selected layer - wrapped in layer object
   * @returns Boolean indicating if the layer is queryable
   */
  isLayerQueryable(layer_container: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }
}

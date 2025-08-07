import {Injectable, inject} from '@angular/core';

import {HsLayerDescriptor, HsSublayer, HsWmsLayer} from 'hslayers-ng/types';
import {HsLayerManagerVisibilityService} from 'hslayers-ng/services/layer-manager';
import {getCachedCapabilities} from 'hslayers-ng/common/extensions';
import {
  getLayerParams,
  isLayerArcgis,
  updateLayerParams,
} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorSublayerService {
  private hsLayerManagerVisibilityService = inject(
    HsLayerManagerVisibilityService,
  );

  layer: HsLayerDescriptor;
  populatedLayers: Array<any> = [];
  sublayers: HsSublayer[] = [];

  getSubLayers(layer: HsLayerDescriptor): HsSublayer[] {
    return layer ? this.populateSubLayers(layer) : [];
  }

  /**
   * Converts HsWmsLayer to HsSublayer
   */
  mapWMSToLayerVisibility(
    layers: HsWmsLayer[],
    visible: boolean,
  ): HsSublayer[] {
    return layers.map((layer) => {
      const mappedLayer: HsSublayer = {
        name: layer.Name,
        title: layer.Title,
        visible: visible,
        previousVisible: undefined,
        maxResolution: layer.maxResolution,
        // Recursively map sublayers if they exist
        sublayers: layer.Layer
          ? this.mapWMSToLayerVisibility(layer.Layer as HsWmsLayer[], visible)
          : undefined,
      };

      return mappedLayer;
    });
  }

  /**
   * Populates the sublayers of a layer with the given layer descriptor.
   */
  populateSubLayers(lyr: HsLayerDescriptor): HsSublayer[] {
    if (this.populatedLayers.includes(lyr.uid)) {
      return lyr._sublayers;
    }

    const layer = lyr.layer;
    const subLayers: HsWmsLayer[] = getCachedCapabilities(layer)?.Layer;

    if (subLayers?.length > 0) {
      const parsed = this.mapWMSToLayerVisibility(subLayers, lyr.visible);
      this.populatedLayers.push(lyr.uid);
      lyr._sublayers = parsed;
      return parsed;
    }
  }

  /**
   * Constructs LAYERS param for layer visibility
   */
  constructLayersParam(layers: HsSublayer[]): string {
    const getVisibleLayers = (layer: HsSublayer): string[] => {
      if (!layer.visible) {
        return [];
      }
      if (layer.sublayers?.length) {
        const visibleSublayers = layer.sublayers.flatMap(getVisibleLayers);
        return visibleSublayers.length === layer.sublayers.length
          ? [layer.name]
          : visibleSublayers;
      }
      return [layer.name];
    };

    return layers.flatMap(getVisibleLayers).join(',');
  }

  /**
   * Handles the selection of a sublayer, updating the layer's visibility and parameters.
   */
  subLayerSelected(): void {
    const layer = this.layer;
    if (!layer) {
      console.error('Trying to update sublayer on undefined layer');
      return;
    }
    const params = getLayerParams(layer.layer);
    params.LAYERS = this.constructLayersParam(layer._sublayers);

    // Special handling for ArcGIS layers
    if (isLayerArcgis(layer.layer)) {
      params.LAYERS = `show:${params.LAYERS}`;
    }

    // If no sublayers are visible, update the overall layer visibility
    if (params.LAYERS == '' || params.LAYERS == 'show:') {
      this.hsLayerManagerVisibilityService.changeLayerVisibility(
        !layer.visible,
        layer,
      );
      return;
    }

    // If the layer was previously invisible, make it visible
    if (layer.visible == false) {
      this.hsLayerManagerVisibilityService.changeLayerVisibility(
        !layer.visible,
        layer,
      );
    }

    // Update the layer parameters
    updateLayerParams(layer.layer, params);
  }
}

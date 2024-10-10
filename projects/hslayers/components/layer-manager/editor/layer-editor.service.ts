import {ComponentRef, Injectable, Type, ViewContainerRef} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject, filter} from 'rxjs';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {HS_PRMS, HsShareUrlService} from 'hslayers-ng/services/share';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorSublayerService} from './sublayers/layer-editor-sub-layer.service';
import {HsLayerEditorSublayersComponent} from './sublayers/layer-editor-sublayers.component';
import {HsLayerEditorVectorLayerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerManagerMetadataService} from 'hslayers-ng/services/layer-manager';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLegendDescriptor} from 'hslayers-ng/components/legend';
import {HsLegendService} from 'hslayers-ng/components/legend';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsWmsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';
import {
  getCachedCapabilities,
  getCluster,
  getInlineLegend,
  getWmsOriginalExtent,
  setCluster,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorService {
  legendDescriptor: HsLegendDescriptor;

  layerTitleChange: Subject<{
    newTitle: string;
    oldTitle: string;
    layer: Layer<Source>;
  }> = new Subject();

  editorComponent: ComponentRef<HsLayerEditorComponent>;

  sublayerEditorComponent: ComponentRef<HsLayerEditorSublayersComponent>;

  constructor(
    private HsMapService: HsMapService,
    private HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsLegendService: HsLegendService,
    private HsLayerSelectorService: HsLayerSelectorService,
    private HsLayerManagerMetadataService: HsLayerManagerMetadataService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private hsShareUrlService: HsShareUrlService,
  ) {
    this.HsLayerSelectorService.layerSelected
      .pipe(filter((layer) => !!layer))
      .subscribe(async (layer) => {
        this.legendDescriptor =
          await this.HsLegendService.getLayerLegendDescriptor(layer.layer);
      });
  }

  /**
   * Create layer editor component for settings
   * @param vcr - View container reference
   * @param layer - Layer
   */
  createLayerEditor(
    vcr: ViewContainerRef,
    layer: HsLayerDescriptor,
  ): ComponentRef<HsLayerEditorComponent> | undefined {
    return this.createEditor(vcr, layer, 'settings', HsLayerEditorComponent);
  }

  /**
   * Create layer editor component for sublayers
   * @param vcr - View container reference
   * @param layer - Layer
   */
  createSublayerEditor(
    vcr: ViewContainerRef,
    layer: HsLayerDescriptor,
  ): ComponentRef<HsLayerEditorSublayersComponent> | undefined {
    return this.createEditor(
      vcr,
      layer,
      'sublayers',
      HsLayerEditorSublayersComponent,
    );
  }

  /**
   * Generic method to create an editor component
   * @param vcr - View container reference
   * @param layer - Layer
   * @param type - Type of editor ('settings' or 'sublayers')
   * @param componentType - Component type to create
   */
  private createEditor<T>(
    vcr: ViewContainerRef,
    layer: HsLayerDescriptor,
    type: 'settings' | 'sublayers',
    componentType: Type<T>,
  ): ComponentRef<T> | undefined {
    const currentComponent =
      type === 'settings' ? this.editorComponent : this.sublayerEditorComponent;
    if (currentComponent) {
      currentComponent.destroy();
    }
    vcr.clear();

    const shouldCreateEditor = this.toggleLayerEditor(layer, type);

    if (shouldCreateEditor) {
      const component = vcr.createComponent(componentType);
      component.setInput('layer', layer);

      if (type === 'settings') {
        this.editorComponent =
          component as ComponentRef<HsLayerEditorComponent>;
      } else {
        this.sublayerEditorComponent =
          component as ComponentRef<HsLayerEditorSublayersComponent>;
      }

      return component;
    }
    return undefined;
  }

  /**
   * Toggles layer editor for current layer.
   * @param layer - Selected layer
   * @param toToggle - Part of layer editor to be toggled ('sublayers' or 'settings')
   * @returns Boolean indicating whether the editor should be created
   */
  toggleLayerEditor(
    layer: HsLayerDescriptor,
    toToggle: 'sublayers' | 'settings',
  ): boolean {
    if (!getCachedCapabilities(layer.layer)) {
      this.HsLayerManagerMetadataService.fillMetadata(layer);
    }

    if (toToggle === 'sublayers' && !layer.hasSublayers) {
      return false;
    }

    if (toToggle === 'settings') {
      if (this.HsLayerSelectorService.currentLayer !== layer) {
        this.setCurrentLayer(layer);
        layer.settings = true;
        return true;
      } else {
        layer.settings = !layer.settings;
        this.setCurrentLayer(undefined);
        return false;
      }
    } else {
      const currentLayer = this.HsLayerEditorSublayerService.layer;

      if (currentLayer === layer) {
        // If the same layer is clicked again, deselect it
        this.HsLayerEditorSublayerService.layer = null;
        layer.sublayers = false;
      } else {
        // If a different layer is clicked
        if (currentLayer) {
          // Deselect the previously selected layer, if any
          currentLayer.sublayers = false;
        }
        // Select the new layer
        this.HsLayerEditorSublayerService.layer = layer;
        layer.sublayers = true;
      }

      // Return the final state of layer.sublayers
      return layer.sublayers;
    }
  }

  /**
   * Updates the current layer and its title in the URL
   * @param layer - The layer to set as current or undefined to remove the current layer
   */
  setCurrentLayer(layer: HsLayerDescriptor | undefined): void {
    this.updateGetParam(layer?.title);
    this.HsLayerSelectorService.select(layer);
  }

  private updateGetParam(title: string | undefined) {
    const t = {};
    t[HS_PRMS.layerSelected] = title;
    this.hsShareUrlService.updateCustomParams(t);
  }

  /**
   * Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabilities request (for WMS layer)
   * @param layer - OpenLayers layer to zoom to
   */
  async zoomToLayer(layer: Layer<Source>): Promise<boolean> {
    let extent = null;
    if (layer.getExtent()) {
      extent = layer.getExtent();
    } else if ((<any>layer.getSource()).getExtent != undefined) {
      extent = (<any>layer.getSource()).getExtent();
    } else if (getWmsOriginalExtent(layer)) {
      extent = getWmsOriginalExtent(layer);
    }
    if (extent) {
      this.fitIfExtentSet(extent, layer);
      return true;
    }
    if (extent === null && this.HsLayerUtilsService.isLayerWMS(layer)) {
      /**
       * NOTE:
       * Used when 'queryCapabilities' is set to false on layer. Otherwise set when parsing capabilities
       */
      const url = this.HsLayerUtilsService.getURL(layer);
      const wrapper = await this.HsWmsGetCapabilitiesService.request(url);
      const parser = new WMSCapabilities();
      const caps = parser.read(wrapper.response);
      if (Array.isArray(caps.Capability.Layer.Layer)) {
        const layers = this.HsLayerUtilsService.getLayerParams(layer)?.LAYERS;
        const foundDefs = caps.Capability.Layer.Layer.map((lyr) =>
          this.HsLayerManagerMetadataService.identifyLayerObject(layers, lyr),
        ).filter((item) => item);
        const foundDef = foundDefs.length > 0 ? foundDefs[0] : null;
        if (foundDef) {
          extent = foundDef.EX_GeographicBoundingBox || foundDef.BoundingBox;
          this.fitIfExtentSet(this.transformToCurrentProj(extent), layer);
          return true;
        }
      } else if (typeof caps.Capability.Layer == 'object') {
        extent =
          caps.Capability.Layer.EX_GeographicBoundingBox ||
          caps.Capability.Layer.BoundingBox;
        this.fitIfExtentSet(this.transformToCurrentProj(extent), layer);
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Set cluster for layer
   * @param layer - Layer
   * @param newValue - To cluster or not to cluster
   * @param distance - Distance in pixels
   * @returns Current cluster state
   */
  cluster(layer: Layer<Source>, newValue: boolean, distance: number): boolean {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      setCluster(layer, newValue);
      this.HsLayerEditorVectorLayerService.cluster(
        newValue,
        layer,
        distance,
        !this.HsLayerEditorVectorLayerService.layersClusteredFromStart.includes(
          layer,
        ),
      );
      this.HsEventBusService.compositionEdits.next();
    } else {
      return getCluster(layer);
    }
  }

  /**
   * @typedef {Array<number>} Extent
   * @param {Extent} extent - Extent in EPSG:4326
   */
  fitIfExtentSet(extent: number[], layer: Layer<Source>): void {
    if (extent !== null) {
      //no Extent + originalExtent = ignoring extent
      if (!(!layer.getExtent() && getWmsOriginalExtent(layer))) {
        layer.setExtent(extent);
      }
      this.HsMapService.fitExtent(extent);
    }
  }

  transformToCurrentProj(extent: number[]): number[] {
    return transformExtent(
      extent,
      'EPSG:4326',
      this.HsMapService.getCurrentProj(),
    );
  }

  legendVisible(): boolean {
    const legendDescriptor = this.legendDescriptor;
    return (
      this.HsLegendService.legendValid(legendDescriptor) &&
      (getInlineLegend(legendDescriptor.lyr) ||
        !this.HsLayoutService.panelEnabled('legend'))
    );
  }

  /**
   * Test if layer is Vector layer
   * @param layer - Selected layer
   */
  isLayerVectorLayer(layer: Layer<Source>): boolean {
    return this.HsLayerUtilsService.isLayerVectorLayer(layer);
  }
}

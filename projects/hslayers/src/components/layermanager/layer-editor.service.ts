import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Subject} from 'rxjs';
import {WMSCapabilities} from 'ol/format';
import {get as getProj, transform, transformExtent} from 'ol/proj';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLegendDescriptor} from '../legend/legend-descriptor.interface';
import {HsLegendService} from '../legend/legend.service';
import {HsMapService} from '../map/map.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';

import {
  getCluster,
  getDeclutter,
  getInlineLegend,
  setCluster,
  setDeclutter,
} from '../../common/layer-extensions';
@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorService {
  legendDescriptor: HsLegendDescriptor;
  layerTitleChange: Subject<{
    newTitle: string;
    oldTitle: string;
    layer: VectorLayer;
  }> = new Subject();

  layerDimensionDefinitionChange: Subject<{
    layer: Layer;
  }> = new Subject();

  constructor(
    public HsMapService: HsMapService,
    public HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsLegendService: HsLegendService,
    public HsLayerSelectorService: HsLayerSelectorService,
    public HsLayerManagerMetadataService: HsLayerManagerMetadataService
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.legendDescriptor = this.HsLegendService.getLayerLegendDescriptor(
        layer.layer
      );
    });
  }

  /**
   * @function zoomToLayer
   * @memberOf HsLayerEditorService
   * @param {Layer} layer Openlayers layer to zoom to
   * @description Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabalities request (for WMS layer)
   */
  async zoomToLayer(layer: Layer) {
    let extent = null;
    if (layer.getExtent()) {
      extent = layer.getExtent();
    } else if (layer.getSource().getExtent != undefined) {
      extent = layer.getSource().getExtent();
    }
    if (extent) {
      this.fitIfExtentSet(extent, layer);
      return true;
    }
    if (extent === null && this.HsLayerUtilsService.isLayerWMS(layer)) {
      let url = null;
      if (layer.getSource().getUrls) {
        //Multi tile
        url = layer.getSource().getUrls()[0];
      }
      if (layer.getSource().getUrl) {
        //Single tile
        url = layer.getSource().getUrl();
      }
      const capabilities_xml = await this.HsWmsGetCapabilitiesService.requestGetCapabilities(
        url,
        {castOwsCapabilitiesReceived: false}
      );
      const parser = new WMSCapabilities();
      const caps = parser.read(capabilities_xml);
      if (Array.isArray(caps.Capability.Layer.Layer)) {
        const foundDefs = caps.Capability.Layer.Layer.map((lyr) =>
          this.HsLayerManagerMetadataService.identifyLayerObject(
            layer.getSource().getParams().LAYERS,
            lyr
          )
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
   * @function cluster
   * @memberOf HsLayerEditorService
   * @description Set cluster for layer
   * @param {Layer} layer Layer
   * @param {boolean} newValue To cluster or not to cluster
   * @param {number} distance Distance in pixels
   * @returns {boolean} Current cluster state
   */
  cluster(
    layer: Layer,
    newValue: boolean,
    distance: number
  ): boolean | undefined {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      setCluster(layer, newValue);
      this.HsLayerEditorVectorLayerService.cluster(newValue, layer, distance);
      this.HsEventBusService.compositionEdits.next();
    } else {
      return getCluster(layer);
    }
  }

  /**
   * @function declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter for layer
   * @param {Layer} layer Layer
   * @param {boolean} newValue To clutter or not to clutter
   * @returns {boolean} Current clutter state
   */
  declutter(layer: Layer, newValue: boolean): boolean | undefined {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      setDeclutter(layer, newValue);
      this.HsLayerEditorVectorLayerService.declutter(newValue, layer);
      this.HsEventBusService.compositionEdits.next();
    } else {
      return getDeclutter(layer);
    }
  }

  /**
   * @typedef {Array<number>} Extent
   * @param {Extent} extent Extent in EPSG:4326
   * @param {Layer} layer
   */
  fitIfExtentSet(extent: number[], layer: Layer): void {
    if (extent !== null) {
      layer.setExtent(extent);
      this.HsMapService.map
        .getView()
        .fit(extent, this.HsMapService.map.getSize());
    }
  }

  /**
   * @param extent
   */
  transformToCurrentProj(extent: number[]): number[] {
    return transformExtent(
      extent,
      'EPSG:4326',
      this.HsMapService.getCurrentProj()
    );
  }

  legendVisible(): boolean {
    return (
      this.HsLegendService.legendValid(this.legendDescriptor) &&
      (getInlineLegend(this.legendDescriptor.lyr) ||
        !this.HsLayoutService.panelEnabled('legend'))
    );
  }
}

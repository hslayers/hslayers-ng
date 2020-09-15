import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLegendDescriptor} from '../legend/legend-descriptor.interface';
import {HsLegendService} from '../legend';
import {HsMapService} from '../map/map.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {WMSCapabilities} from 'ol/format';
import {get as getProj, transform, transformExtent} from 'ol/proj';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorService {
  legendDescriptor: HsLegendDescriptor;

  constructor(
    private HsMapService: HsMapService,
    private HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsLegendService: HsLegendService,
    private HsLayerSelectorService: HsLayerSelectorService
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
    if (layer.get('BoundingBox')) {
      extent = this.getExtentFromBoundingBoxAttribute(layer);
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
        url
      );
      const parser = new WMSCapabilities();
      const caps = parser.read(capabilities_xml);
      if (Array.isArray(caps.Capability.Layer.Layer)) {
        const foundDefs = caps.Capability.Layer.Layer.filter(
          (layer_def) => layer_def.Name == layer.getSource().getParams().LAYERS
        );
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
      layer.set('cluster', newValue);
      this.HsLayerEditorVectorLayerService.cluster(newValue, layer, distance);
      this.HsEventBusService.compositionEdits.next();
    } else {
      return layer.get('cluster');
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
      layer.set('declutter', newValue);
      this.HsLayerEditorVectorLayerService.declutter(newValue, layer);
      this.HsEventBusService.compositionEdits.next();
    } else {
      return layer.get('declutter');
    }
  }

  /**
   * @typedef {Array<number>} Extent
   * @param {Extent} extent Extent in EPSG:4326
   * @param {Layer} layer
   */
  fitIfExtentSet(extent: number[], layer: Layer): void {
    if (extent !== null) {
      layer.set('BoundingBox', extent);
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
      this.HsMapService.map.getView().getProjection()
    );
  }

  /**
   * (PRIVATE) Get transformated extent from layer "BoundingBox" property
   *
   * @function getExtentFromBoundingBoxAttribute
   * @memberOf hs.layermanager.controller
   * @param {Layer} layer Selected layer
   * @returns {Extent} Extent
   */
  getExtentFromBoundingBoxAttribute(layer: Layer): number[] {
    let extent = null;
    const bbox = layer.get('BoundingBox');
    if (Array.isArray(bbox) && bbox.length == 4) {
      extent = this.transformToCurrentProj(bbox);
    } else {
      for (let ix = 0; ix < bbox.length; ix++) {
        if (
          getProj(bbox[ix].crs) != undefined ||
          layer.getSource().getParams().FROMCRS != undefined
        ) {
          const crs = bbox[ix].crs || layer.getSource().getParams().FROMCRS;
          const b = bbox[ix].extent;
          let first_pair = [b[0], b[1]];
          let second_pair = [b[2], b[3]];
          first_pair = transform(
            first_pair,
            crs,
            this.HsMapService.map.getView().getProjection()
          );
          second_pair = transform(
            second_pair,
            crs,
            this.HsMapService.map.getView().getProjection()
          );
          extent = [
            first_pair[0],
            first_pair[1],
            second_pair[0],
            second_pair[1],
          ];
          break;
        }
      }
    }
    return extent;
  }

  legendVisible(): boolean {
    return (
      this.HsLegendService.legendValid(this.legendDescriptor) &&
      (this.legendDescriptor.lyr.get('inlineLegend') ||
        !this.HsLayoutService.panelEnabled('legend'))
    );
  }
}

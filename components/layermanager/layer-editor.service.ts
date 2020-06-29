import { WMSCapabilities } from 'ol/format';
import { get as getProj, transform, transformExtent } from 'ol/proj';
import { Injectable } from '@angular/core';
import { HsLayerEditorVectorLayerService } from './layer-editor-vector-layer.service';
import { HsMapService } from '../map/map.service.js';
import { HsLayerUtilsService } from '../utils/utils.service';
import { HsWmsGetCapabilitiesService } from '../../common/wms/get-capabilities.service.js'

@Injectable({
  providedIn: 'any',
})
export class HsLayerEditorService {
  constructor(
    private HsMapService: HsMapService,
    private HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService) { }

  /**
   * @function zoomToLayer
   * @memberOf HsLayerEditorService
   * @param {ol/layer} layer Openlayers layer to zoom to
   * @description Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabalities request (for WMS layer)
   */
  async zoomToLayer(layer) {
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
          (layer_def) =>
            layer_def.Name == layer.getSource().getParams().LAYERS
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
   * @param {ol/layer} layer Layer
   * @param {boolean} newValue To cluster or not to cluster
   * @param {int} distance Distance in pixels
   * @returns {boolean} Current cluster state
   */
  cluster(layer, newValue, distance) {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      layer.set('cluster', newValue);
      this.HsLayerEditorVectorLayerService.cluster(newValue, layer, distance);
      $rootScope.$broadcast('compositions.composition_edited');
    } else {
      return layer.get('cluster');
    }
  }

  /**
   * @function declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter for layer
   * @param {ol/layer} layer Layer
   * @param {boolean} newValue To clutter or not to clutter
   * @returns {boolean} Current clutter state
   */
  declutter(layer, newValue) {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      layer.set('declutter', newValue);
      this.HsLayerEditorVectorLayerService.declutter(newValue, layer);
      $rootScope.$broadcast('compositions.composition_edited');
    } else {
      return layer.get('declutter');
    }
  }


  /**
   * @param {ol/extent} extent Extent in EPSG:4326
   * @param {ol/layer} layer
   */
  fitIfExtentSet(extent, layer) {
    if (extent !== null) {
      layer.set('BoundingBox', extent);
      this.HsMapService.map.getView().fit(extent, this.HsMapService.map.getSize());
    }
  }

  /**
   * @param extent
   */
  transformToCurrentProj(extent) {
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
   * @param {Ol.layer} layer Selected layer
   * @returns {ol/extent} Extent
   */
  getExtentFromBoundingBoxAttribute(layer) {
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
}

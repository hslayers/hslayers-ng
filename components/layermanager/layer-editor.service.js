import {WMSCapabilities} from 'ol/format';
import {get as getProj, transform, transformExtent} from 'ol/proj';

/**
 * @param HsMapService
 * @param HsWmsGetCapabilitiesService
 * @param HsLayerUtilsService
 * @param HsLayerEditorVectorLayerService
 * @param $rootScope
 */
export default function (
  HsMapService,
  HsWmsGetCapabilitiesService,
  HsLayerUtilsService,
  HsLayerEditorVectorLayerService,
  $rootScope
) {
  'ngInject';
  const me = {
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
        extent = getExtentFromBoundingBoxAttribute(layer);
      } else if (angular.isDefined(layer.getSource().getExtent)) {
        extent = layer.getSource().getExtent();
      }
      if (extent) {
        fitIfExtentSet(extent, layer);
        return true;
      }
      if (extent === null && HsLayerUtilsService.isLayerWMS(layer)) {
        let url = null;
        if (layer.getSource().getUrls) {
          //Multi tile
          url = layer.getSource().getUrls()[0];
        }
        if (layer.getSource().getUrl) {
          //Single tile
          url = layer.getSource().getUrl();
        }
        const capabilities_xml = await HsWmsGetCapabilitiesService.requestGetCapabilities(
          url
        );
        const parser = new WMSCapabilities();
        const caps = parser.read(capabilities_xml);
        if (angular.isArray(caps.Capability.Layer.Layer)) {
          const foundDefs = caps.Capability.Layer.Layer.filter(
            (layer_def) =>
              layer_def.Name == layer.getSource().getParams().LAYERS
          );
          const foundDef = foundDefs.length > 0 ? foundDefs[0] : null;
          if (foundDef) {
            extent = foundDef.EX_GeographicBoundingBox || foundDef.BoundingBox;
            fitIfExtentSet(transformToCurrentProj(extent), layer);
            return true;
          }
        } else if (angular.isObject(caps.Capability.Layer)) {
          extent =
            caps.Capability.Layer.EX_GeographicBoundingBox ||
            caps.Capability.Layer.BoundingBox;
          fitIfExtentSet(transformToCurrentProj(extent), layer);
          return true;
        } else {
          return false;
        }
      }
    },

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
      if (angular.isUndefined(layer)) {
        return;
      }
      if (angular.isDefined(newValue)) {
        layer.set('cluster', newValue);
        HsLayerEditorVectorLayerService.cluster(newValue, layer, distance);
        $rootScope.$broadcast('compositions.composition_edited');
      } else {
        return layer.get('cluster');
      }
    },
    /**
     * @function declutter
     * @memberOf HsLayerEditorService
     * @description Set declutter for layer
     * @param {ol/layer} layer Layer
     * @param {boolean} newValue To clutter or not to clutter
     * @returns {boolean} Current clutter state
     */
    declutter(layer, newValue) {
      if (angular.isUndefined(layer)) {
        return;
      }
      if (angular.isDefined(newValue)) {
        layer.set('declutter', newValue);
        HsLayerEditorVectorLayerService.declutter(newValue, layer);
        $rootScope.$broadcast('compositions.composition_edited');
      } else {
        return layer.get('declutter');
      }
    },
  };

  /**
   * @param {ol/extent} extent Extent in EPSG:4326
   * @param {ol/layer} layer
   */
  function fitIfExtentSet(extent, layer) {
    if (extent !== null) {
      // layer.set('BoundingBox', extent);
      HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
    }
  }

  /**
   * @param extent
   */
  function transformToCurrentProj(extent) {
    return transformExtent(
      extent,
      'EPSG:4326',
      HsMapService.map.getView().getProjection()
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
  function getExtentFromBoundingBoxAttribute(layer) {
    let extent = null;
    const bbox = layer.get('BoundingBox');
    if (
      angular.isArray(bbox) &&
      bbox.length == 4 &&
      angular.isNumber(bbox[0])
    ) {
      extent = transformToCurrentProj(bbox);
      if (bbox.some(isNaN)) {
        layer.unset('BoundingBox');
        extent = layer.getSource().getExtent();
      }
    } else {
      const currentProj = HsMapService.map.getView().getProjection();
      const preffered = bbox.filter(
        (bboxInCrs) => bboxInCrs.crs == currentProj.getCode()
      )[0];
      if (preffered) {
        const crs = preffered.crs;
        const b = preffered.extent;
        extent = transformExtent(
          b,
          crs,
          HsMapService.map.getView().getProjection()
        );
        return extent;
      }
      for (let ix = 0; ix < bbox.length; ix++) {
        if (
          angular.isDefined(getProj(bbox[ix].crs)) &&
          bbox[ix].crs != 'CRS:84'
        ) {
          const crs = bbox[ix].crs;
          const b = bbox[ix].extent;
          extent = transformExtent(
            b,
            crs,
            HsMapService.map.getView().getProjection()
          );
          break;
        }
      }
    }
    return extent;
  }
  return me;
}

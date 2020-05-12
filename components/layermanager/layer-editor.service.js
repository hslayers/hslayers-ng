import {WMSCapabilities} from 'ol/format';
import {get as getProj, transform, transformExtent} from 'ol/proj';

export default [
  'hs.map.service',
  'hs.wms.getCapabilitiesService',
  'hs.utils.layerUtilsService',
  'hs.layerEditorVectorLayer.service',
  '$rootScope',
  function (
    hsMap,
    WMSgetCapabilitiesService,
    layerUtils,
    vectorLayerService,
    $rootScope
  ) {
    const me = {
      /**
       * @function zoomToLayer
       * @memberOf hs.layerEditor.service
       * @param {ol/layer} layer Openlayers layer to zoom to
       * @description Zoom to selected layer (layer extent). Get extent
       * from bounding box property, getExtent() function or from
       * BoundingBox property of GetCapabalities request (for WMS layer)
       */
      zoomToLayer(layer) {
        let extent = null;
        if (layer.get('BoundingBox')) {
          extent = getExtentFromBoundingBoxAttribute(layer);
        } else if (angular.isDefined(layer.getSource().getExtent)) {
          extent = layer.getSource().getExtent();
        }
        if (extent === null && layerUtils.isLayerWMS(layer)) {
          let url = null;
          if (layer.getSource().getUrls) {
            //Multi tile
            url = layer.getSource().getUrls()[0];
          }
          if (layer.getSource().getUrl) {
            //Single tile
            url = layer.getSource().getUrl();
          }
          WMSgetCapabilitiesService.requestGetCapabilities(url).then(
            (capabilities_xml) => {
              //debugger;
              const parser = new WMSCapabilities();
              const caps = parser.read(capabilities_xml);
              if (angular.isArray(caps.Capability.Layer.Layer)) {
                angular.forEach(caps.Capability.Layer.Layer, (layer_def) => {
                  if (layer_def.Name == layer.getSource().getParams().LAYERS) {
                    layer.set('BoundingBox', layer_def.BoundingBox);
                  }
                });
              }
              if (angular.isObject(caps.Capability.Layer)) {
                layer.set('BoundingBox', caps.Capability.Layer.BoundingBox);
                extent = getExtentFromBoundingBoxAttribute(layer);
                if (extent !== null) {
                  hsMap.map.getView().fit(extent, hsMap.map.getSize());
                }
              }
            }
          );
        }
        if (extent !== null) {
          hsMap.map.getView().fit(extent, hsMap.map.getSize());
        }
      },

      /**
       * @function cluster
       * @memberOf hs.layerEditor.service
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
          vectorLayerService.cluster(newValue, layer, distance);
          $rootScope.$broadcast('compositions.composition_edited');
        } else {
          return layer.get('cluster');
        }
      },
      /**
       * @function cluster
       * @memberOf hs.layerEditor.service
       * @description Set cluster for layer
       * @param {ol/layer} layer Layer
       * @param {boolean} newValue To cluster or not to cluster
       * @returns {boolean} Current cluster state
       */
      declutter(layer, newValue) {
        if (angular.isUndefined(layer)) {
          return;
        }
        if (angular.isDefined(newValue)) {
          layer.set('declutter', newValue);
          vectorLayerService.declutter(newValue, layer);
          $rootScope.$broadcast('compositions.composition_edited');
        } else {
          return layer.get('declutter');
        }
      },
    };

    /**
     * (PRIVATE) Get transformated extent from layer "BoundingBox" property
     * @function getExtentFromBoundingBoxAttribute
     * @memberOf hs.layermanager.controller
     * @param {Ol.layer} layer Selected layer
     * @returns {ol/extent} Extent
     */
    function getExtentFromBoundingBoxAttribute(layer) {
      let extent = null;
      const bbox = layer.get('BoundingBox');
      if (angular.isArray(bbox) && bbox.length == 4) {
        extent = transformExtent(
          bbox,
          'EPSG:4326',
          hsMap.map.getView().getProjection()
        );
      } else {
        for (let ix = 0; ix < bbox.length; ix++) {
          if (
            angular.isDefined(getProj(bbox[ix].crs)) ||
            angular.isDefined(layer.getSource().getParams().FROMCRS)
          ) {
            const crs = bbox[ix].crs || layer.getSource().getParams().FROMCRS;
            const b = bbox[ix].extent;
            let first_pair = [b[0], b[1]];
            let second_pair = [b[2], b[3]];
            first_pair = transform(
              first_pair,
              crs,
              hsMap.map.getView().getProjection()
            );
            second_pair = transform(
              second_pair,
              crs,
              hsMap.map.getView().getProjection()
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
    return me;
  },
];

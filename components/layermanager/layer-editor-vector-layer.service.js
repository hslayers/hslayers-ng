import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, RegularShape, Stroke, Style, Text} from 'ol/style';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {Point} from 'ol/geom';

/**
 * @param HsMapService
 * @param HsUtilsService
 * @param HsStylesService
 */
export default function (HsMapService, HsUtilsService, HsStylesService) {
  'ngInject';
  const me = {};
  /**
   * @function Declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter of features;
   * @param {boolean} newValue
   * @param {ol/Layer} layer
   */
  me.declutter = function (newValue, layer) {
    const index = HsMapService.map.getLayers().getArray().indexOf(layer);
    if (newValue == true && !layer.get('cluster')) {
      HsMapService.map.removeLayer(layer);
      HsMapService.map
        .getLayers()
        .insertAt(index, me.cloneVectorLayer(layer, newValue));
    } else {
      HsMapService.map.removeLayer(layer);
      HsMapService.map
        .getLayers()
        .insertAt(index, me.cloneVectorLayer(layer, false));
    }
  };
  me.cloneVectorLayer = function (layer, declutter) {
    const options = {};
    layer.getKeys().forEach((k) => (options[k] = layer.get(k)));
    angular.extend(options, {
      declutter,
      source: layer.getSource(),
      style: layer.getStyleFunction() || layer.getStyle(),
      maxResolution: layer.getMaxResolution(),
      minResolution: layer.getMinResolution(),
      visible: layer.getVisible(),
      opacity: layer.getOpacity(),
    });
    return new VectorLayer(options);
  };
  /**
   * @function cluster
   * @memberOf HsLayerEditorService
   * @description Set cluster for layer;
   * @param {boolean} newValue
   * @param {ol/Layer} layer
   * @param {number} distance
   */
  me.cluster = function (newValue, layer, distance) {
    if (newValue == true && !layer.get('declutter')) {
      layer.set('hsOriginalStyle', layer.getStyle());
      if (!HsUtilsService.instOf(layer.getSource(), Cluster)) {
        layer.setSource(me.createClusteredSource(layer, distance));
        HsStylesService.styleClusteredLayer(layer);
      }
    } else {
      layer.setStyle(layer.get('hsOriginalStyle'));
      layer.setSource(layer.getSource().getSource());
    }
  };

  me.createClusteredSource = function (layer, distance) {
    return new Cluster({
      distance: distance,
      source: layer.getSource(),
      geometryFunction: function (feature) {
        switch (feature.getGeometry().getType()) {
          case 'Point':
            return feature.getGeometry();
          case 'Circle':
            return new Point(feature.getGeometry().getCenter());
          case 'Polygon':
            return feature.getGeometry().getInteriorPoint();
          case 'LineString':
            return new Point(feature.getGeometry().getFirstCoordinate());
          default:
            return null;
        }
      },
    });
  };
  return me;
}

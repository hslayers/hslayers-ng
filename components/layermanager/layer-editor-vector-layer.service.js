import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, RegularShape, Stroke, Style, Text} from 'ol/style';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {Point} from 'ol/geom';

/**
 * @param HsMapService
 */
export default function (HsMapService) {
  'ngInject';
  const me = {};
  /**
   * @function Declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter of features;
   * @param newValue
   * @param layer
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
   * @param newValue
   * @param layer
   * @param distance
   */
  me.cluster = function (newValue, layer, distance) {
    if (!layer.hsOriginalStyle) {
      layer.hsOriginalStyle = layer.getStyle();
    }
    if (newValue == true && !layer.get('declutter')) {
      const styleCache = {};
      layer.setSource(me.createClusteredSource(layer, distance));
      layer.setStyle((feature, resolution) => {
        const size = feature.get('features').length;
        if (size > 1) {
          let textStyle = styleCache[size];
          if (!textStyle) {
            textStyle = new Style({
              image: new Circle({
                radius: 10,
                stroke: new Stroke({
                  color: '#fff',
                }),
                fill: new Fill({
                  color: '#3399CC',
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: '#000',
                }),
              }),
            });
            styleCache[size] = textStyle;
          }
          return textStyle;
        } else {
          let tmp;
          if (typeof layer.hsOriginalStyle == 'function') {
            tmp = layer.hsOriginalStyle(feature, resolution);
          } else {
            tmp = layer.hsOriginalStyle;
          }
          const originalFeature = feature.get('features');
          if (tmp.length) {
            tmp[0].setGeometry(originalFeature[0].getGeometry());
          } else {
            tmp.setGeometry(originalFeature[0].getGeometry());
          }
          return tmp;
        }
      });
    } else {
      layer.setStyle(() => {
        if (typeof layer.hsOriginalStyle == 'function') {
          return layer.hsOriginalStyle();
        } else {
          return layer.hsOriginalStyle;
        }
      });
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

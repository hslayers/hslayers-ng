import VectorLayer from 'ol/layer/Vector';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import { Cluster } from 'ol/source';
import { Point } from 'ol/geom';
import { Injectable } from '@angular/core';
import { HsMapService } from '../map/map.service.js';
import { HsUtilsService } from '../utils/utils.service';

@Injectable({
  providedIn: 'any',
})
export class HsLayerEditorVectorLayerService {

  constructor(private HsMapService: HsMapService, private HsUtilsService: HsUtilsService) {

  }

  /**
   * @function Declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter of features;
   * @param {boolean} newValue
   * @param {ol/Layer} layer
   */
  declutter(newValue, layer) {
    const index = this.HsMapService.map.getLayers().getArray().indexOf(layer);
    if (newValue == true && !layer.get('cluster')) {
      this.HsMapService.map.removeLayer(layer);
      this.HsMapService.map
        .getLayers()
        .insertAt(index, this.cloneVectorLayer(layer, newValue));
    } else {
      this.HsMapService.map.removeLayer(layer);
      this.HsMapService.map
        .getLayers()
        .insertAt(index, this.cloneVectorLayer(layer, false));
    }
  }

  cloneVectorLayer(layer, declutter) {
    const options = {};
    layer.getKeys().forEach((k) => (options[k] = layer.get(k)));
    Object.assign(options, {
      declutter,
      source: layer.getSource(),
      style: layer.getStyleFunction() || layer.getStyle(),
      maxResolution: layer.getMaxResolution(),
      minResolution: layer.getMinResolution(),
      visible: layer.getVisible(),
      opacity: layer.getOpacity(),
    });
    return new VectorLayer(options);
  }

  /**
   * @function cluster
   * @memberOf HsLayerEditorService
   * @description Set cluster for layer;
   * @param {boolean} newValue
   * @param {ol/Layer} layer
   * @param {number} distance
   */
  cluster(newValue, layer, distance) {
    if (!layer.hsOriginalStyle) {
      layer.hsOriginalStyle = layer.getStyle();
    }
    if (newValue == true && !layer.get('declutter')) {
      if (!this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
        const styleCache = {};
        layer.setSource(this.createClusteredSource(layer, distance));
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
      }
    } else {
      layer.setStyle(layer.hsOriginalStyle);
      layer.setSource(layer.getSource().getSource());
    }
  }

  createClusteredSource(layer, distance) {
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

}

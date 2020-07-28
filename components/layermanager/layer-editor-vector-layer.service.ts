import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style, Text} from 'ol/style';
import {Cluster} from 'ol/source';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Point} from 'ol/geom';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorVectorLayerService {
  constructor(
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService
  ) {}

  /**
   * @function Declutter
   * @memberOf HsLayerEditorService
   * @description Set declutter of features;
   * @param {boolean} newValue
   * @param {Layer} layer
   */
  declutter(newValue: boolean, layer: Layer): void {
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

  cloneVectorLayer(layer: Layer, declutter: boolean): VectorLayer {
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
   * @param {Layer} layer
   * @param {number} distance
   */
  cluster(newValue: boolean, layer: Layer, distance: number) {
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
            let originalStyle;
            if (typeof layer.hsOriginalStyle == 'function') {
              originalStyle = layer.hsOriginalStyle(feature, resolution);
            } else {
              originalStyle = layer.hsOriginalStyle;
            }
            const originalFeature = feature.get('features');
            let newStyle;
            if (originalStyle.length) {
              newStyle = originalStyle[0].clone();
              newStyle.setGeometry(originalFeature[0].getGeometry());
              return [newStyle];
            } else {
              newStyle = originalStyle.clone();
              newStyle.setGeometry(originalFeature[0].getGeometry());
              return newStyle;
            }
          }
        });
      }
    } else {
      layer.setStyle(layer.hsOriginalStyle);
      layer.setSource(layer.getSource().getSource());
    }
  }

  createClusteredSource(layer: Layer, distance: number): Cluster {
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
  }
}

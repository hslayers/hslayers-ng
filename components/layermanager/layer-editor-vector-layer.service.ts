import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style, Text} from 'ol/style';
import {Cluster} from 'ol/source';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Point} from 'ol/geom';
import {createDefaultStyle} from 'ol/style/Style';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorVectorLayerService {
  clusterStyle = new Style ({
    stroke: new Stroke({
      color: '#fff',
    }),
    fill: new Fill({
      color: '#3399CC',
    }),
  });
  constructor(
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
    private HsQueryVectorService: HsQueryVectorService
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
  cluster(newValue: boolean, layer: Layer, distance: number): void {
    if (newValue == true && !layer.get('declutter')) {
      layer.set('hsOriginalStyle', layer.getStyle());
      if (!this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
        layer.setSource(this.createClusteredSource(layer, distance));
        this.styleLayer(layer);
      }
    } else {
      layer.setStyle(layer.get('hsOriginalStyle'));
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

  styleLayer(layer: VectorLayer): void {
    const styleCache = {};
    layer.setStyle((feature: Feature, resolution: number) => {
      const size = feature.get('features')?.length || 0;
      if (size > 1) {
        return this.makeClusterMarker(styleCache, size);
      } else {
        return this.makeSingleFeatureClusterMarker(feature, resolution, layer);
      }
    });
  }

  private makeSingleFeatureClusterMarker(
    feature: Feature,
    resolution: number,
    layer: VectorLayer
  ) {
    const featureStyle = feature.get('features')
      ? feature.get('features')[0].getStyle()
      : feature.getStyle();

    const originalStyle = featureStyle
      ? featureStyle
      : layer.get('hsOriginalStyle')
      ? layer.get('hsOriginalStyle')
      : createDefaultStyle;

    let appliedStyle = this.applyStyleIfNeeded(
      originalStyle,
      feature,
      resolution
    );
    if (this.isSelectedFeature(feature)) {
      if (Array.isArray(appliedStyle)) {
        appliedStyle = appliedStyle[0];
      }
      appliedStyle = appliedStyle.clone();
      appliedStyle.setFill(
        new Fill({
          color: [255, 255, 255, 0.5],
        })
      );
      appliedStyle.setStroke(
        new Stroke({
          color: [0, 153, 255, 1],
          width: 3,
        })
      );
    }
    return this.useStyleOnFirstFeature(appliedStyle, feature);
  }

  isSelectedFeature(feature: Feature): boolean {
    if (feature.get('features')) {
      return this.isSelectedFeature(feature.get('features')[0]);
    }
    return (
      this.HsQueryVectorService.selector
        .getFeatures()
        .getArray()
        .indexOf(feature) > -1
    );
  }

  private makeClusterMarker(styleCache: {}, size: any) {
    let textStyle = styleCache[size];
    if (!textStyle) {
      textStyle = new Style({
        image: new Circle({
          radius: 10,
          stroke: this.clusterStyle.getStroke(),
          fill: this.clusterStyle.getFill(),
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
  }

  private applyStyleIfNeeded(
    style: any,
    feature: Feature,
    resolution: number
  ): any {
    if (typeof style == 'function') {
      return style(feature, resolution);
    } else {
      return style;
    }
  }

  private useStyleOnFirstFeature(
    style: any,
    clusteredContainerFeature: Feature
  ): Style | Style[] {
    const originalFeature = clusteredContainerFeature.get('features') || [
      clusteredContainerFeature,
    ];
    let newStyle;
    if (style.length) {
      newStyle = style[0].clone();
      newStyle.setGeometry(originalFeature[0].getGeometry());
      return [newStyle];
    } else {
      newStyle = style.clone();
      newStyle.setGeometry(originalFeature[0].getGeometry());
      return newStyle;
    }
  }
}

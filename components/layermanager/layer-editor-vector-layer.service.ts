import VectorLayer from 'ol/layer/Vector';
import {Cluster} from 'ol/source';
import {HsConfig} from './../../config.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from './../styles/styler.service';
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
    private HsUtilsService: HsUtilsService,
    private HsStylerService: HsStylerService,
    private HsConfig: HsConfig
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
        this.HsStylerService.styleClusteredLayer(layer);
        this.updateFeatureTableLayers(layer);
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
  updateFeatureTableLayers(layer: Layer): void {
    const currentLayerIndex = this.HsConfig.layersInFeatureTable.findIndex(
      (l) => l == layer
    );
    if (layer && currentLayerIndex > -1) {
      this.HsConfig.layersInFeatureTable[currentLayerIndex] = layer;
    }
  }
}

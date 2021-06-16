import {Cluster} from 'ol/source';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Point} from 'ol/geom';

import {HsConfig} from './../../config.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from './../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorVectorLayerService {
  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsStylerService: HsStylerService,
    public HsConfig: HsConfig
  ) {}

  /**
   * Convert layer to clustered state where it's source gets nested in another
   * VectorSource and first level sources features contain 'features' attribute
   * with the original features in it as an array
   * @param newValue - Cluster or not to cluster
   * @param distance - Minimum distance in pixels between clusters
   */
  async cluster(
    newValue: boolean,
    layer: Layer,
    distance: number
  ): Promise<void> {
    if (newValue == true) {
      if (!this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
        layer.setSource(this.createClusteredSource(layer, distance));
        await this.HsStylerService.styleClusteredLayer(layer);
        this.updateFeatureTableLayers(layer);
      }
    } else if (this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
      layer.setSource(layer.getSource().getSource());
    }
  }

  createClusteredSource(layer: Layer, distance: number): Cluster {
    return new Cluster({
      distance,
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
    const currentLayerIndex = this.HsConfig.layersInFeatureTable?.findIndex(
      (l) => l == layer
    );
    if (layer && currentLayerIndex > -1) {
      this.HsConfig.layersInFeatureTable[currentLayerIndex] = layer;
    }
  }
}

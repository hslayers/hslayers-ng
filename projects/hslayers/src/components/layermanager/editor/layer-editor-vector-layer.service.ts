import {Circle, Geometry, LineString, Point, Polygon} from 'ol/geom';
import {Cluster, Source} from 'ol/source';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from './../../../config.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from './../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorVectorLayerService {
  layersClusteredFromStart = [];
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
    layer: Layer<Source>,
    distance: number,
    generateStyle: boolean
  ): Promise<void> {
    if (newValue == true) {
      if (!this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
        layer.setSource(this.createClusteredSource(layer, distance));
        if (generateStyle) {
          await this.HsStylerService.styleClusteredLayer(
            layer as VectorLayer<Cluster>
          );
        }
        this.updateFeatureTableLayers(
          layer as VectorLayer<VectorSource<Geometry>>
        );
      }
    } else if (this.HsUtilsService.instOf(layer.getSource(), Cluster)) {
      layer.setSource((layer.getSource() as Cluster).getSource());
    }
  }

  createClusteredSource(layer: Layer<Source>, distance: number): Cluster {
    return new Cluster({
      distance,
      source: layer.getSource() as VectorSource<Geometry>,
      geometryFunction: function (feature) {
        if (!feature) {
          return null;
        }
        switch (feature.getGeometry().getType()) {
          case 'Point':
            return feature.getGeometry() as Point;
          case 'Circle':
            return new Point((feature.getGeometry() as Circle).getCenter());
          case 'Polygon':
            return (feature.getGeometry() as Polygon).getInteriorPoint();
          case 'LineString':
            return new Point(
              (feature.getGeometry() as LineString).getFirstCoordinate()
            );
          default:
            return null;
        }
      },
    });
  }
  updateFeatureTableLayers(layer: VectorLayer<VectorSource<Geometry>>): void {
    const currentLayerIndex = this.HsConfig.layersInFeatureTable?.findIndex(
      (l) => l == layer
    );
    if (layer && currentLayerIndex > -1) {
      this.HsConfig.layersInFeatureTable[currentLayerIndex] = layer;
    }
  }
}

import {Injectable} from '@angular/core';

import {Circle, LineString, Point, Polygon} from 'ol/geom';
import {Cluster, Source, Vector as VectorSource} from 'ol/source';
import {Layer, Vector as VectorLayer} from 'ol/layer';

import {HsConfig} from 'hslayers-ng/config';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsStylerService} from 'hslayers-ng/shared/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorVectorLayerService {
  layersClusteredFromStart = [];
  constructor(
    public hsConfig: HsConfig,
    public hsMapService: HsMapService,
    public hsStylerService: HsStylerService,
    public hsUtilsService: HsUtilsService,
  ) {}

  /**
   * Convert layer to clustered state where its source gets nested in another
   * VectorSource and first level sources features contain 'features' attribute
   * with the original features in it as an array
   * @param newValue - Cluster or not to cluster
   * @param layer - OL Layer to cluster or de-cluster
   * @param distance - Minimum distance in pixels between clusters
   * @param generateStyle - Whether a default cluster style shall be generated for the layer
   */
  async cluster(
    newValue: boolean,
    layer: Layer<Source>,
    distance: number,
    generateStyle: boolean,
  ): Promise<void> {
    if (newValue == true) {
      if (!this.hsUtilsService.instOf(layer.getSource(), Cluster)) {
        layer.setSource(this.createClusteredSource(layer, distance));
        if (generateStyle) {
          await this.hsStylerService.styleClusteredLayer(
            layer as VectorLayer<Cluster>,
          );
        }
        this.updateFeatureTableLayers(layer as VectorLayer<VectorSource>);
      }
    } else if (this.hsUtilsService.instOf(layer.getSource(), Cluster)) {
      layer.setSource((layer.getSource() as Cluster).getSource());
    }
  }

  createClusteredSource(layer: Layer<Source>, distance: number): Cluster {
    return new Cluster({
      distance,
      source: layer.getSource() as VectorSource,
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
              (feature.getGeometry() as LineString).getFirstCoordinate(),
            );
          default:
            return null;
        }
      },
    });
  }

  updateFeatureTableLayers(layer: VectorLayer<VectorSource>): void {
    const currentLayerIndex = this.hsConfig.layersInFeatureTable?.findIndex(
      (l) => l == layer,
    );
    if (layer && currentLayerIndex > -1) {
      this.hsConfig.layersInFeatureTable[currentLayerIndex] = layer;
    }
  }
}

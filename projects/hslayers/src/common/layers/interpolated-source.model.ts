import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Projection} from 'ol/proj';
import {Subject} from 'rxjs';

export interface InterpolatedSourceModel {
  idwCacheSource: VectorSource<Geometry>;
  lastExtent: number[];
  cancelUrlRequest: Subject<void>;
  cacheAvailable(currentExtent?: number[]): boolean;
  getFeaturesInExtent(extent: number[]): void;
  normalizeWeight(features?: Feature<Geometry>[], weight?: string): void;
  fillFeatures(
    response?: any,
    mapProjection?: string | Projection,
    weight?: string,
    extent?: number[]
  ): void;
  createIDWSourceUrl?(url?: string, extent?: number[]): string;
  createVectorLayer?(): VectorLayer<VectorSource<Geometry>>;
}

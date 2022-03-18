import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Projection} from 'ol/proj';

import {InterpolatedLayerParams} from './interpolated-layer.class';

export interface InterpolatedLayerModel {
  apps: {
    [id: string]: InterpolatedLayerParams;
  };
  get(app?: string): InterpolatedLayerParams;
  createIDWSource(features?: Feature<Geometry>[]);
  cacheAvailable(currentExtent?: number[], app?: string): boolean;
  normalizeWeight(features?: Feature<Geometry>[], weight?: string): void;
  fillFeatures?(
    response?: any,
    mapProjection?: string | Projection,
    weight?: string,
    app?: string,
    extent?: number[]
  ): void;
  createIDWSourceUrl?(url?: string, extent?: number[]): string;
}

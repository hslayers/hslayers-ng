import IDW from 'ol-ext/source/IDW';

import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Subject} from 'rxjs';
import {containsExtent} from 'ol/extent';

import {InterpolatedLayerModel} from './interpolated-layer.model';

export const NORMALIZED_WEIGHT_PROPERTY_NAME = 'hs_normalized_IDW_value';

export class InterpolatedLayerParams {
  idwCacheSource: VectorSource<Geometry>;
  lastExtent: number[];
  cancelUrlRequest: Subject<void> = new Subject();
}
export class InterpolatedLayer implements InterpolatedLayerModel {
  apps: {
    [id: string]: InterpolatedLayerParams;
  } = {
    default: new InterpolatedLayerParams(),
  };
  constructor() {}

  /**
   * Get the params saved by the IDW Layer service for the current app
   * @param app - App identifier
   */
  get(app: string): InterpolatedLayerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new InterpolatedLayerParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Create IDW source
   * @param features - OL feature array for the IDW source
   */
  createIDWSource(features: Feature<Geometry>[]) {
    const source = new VectorSource({
      features,
    });
    return new IDW({
      // Source that contains the data
      source: source,
      // Use val as weight property
      weight: NORMALIZED_WEIGHT_PROPERTY_NAME,
    });
  }

  /**
   * Check if cached features are available to use
   * @param currentExtent - Current map extent
   * @param app - App identifier
   */
  cacheAvailable(currentExtent: number[], app: string): boolean {
    const appRef = this.get(app);
    if (!appRef.lastExtent || !appRef.idwCacheSource) {
      return false;
    }
    return (
      containsExtent(appRef.lastExtent, currentExtent) &&
      appRef.idwCacheSource?.getFeatures()?.length > 0
    );
  }
  /**
   * Normalize weight values to be between 0 and 100
   * @param features - OL feature array
   * @param weight - Weight property name
   */
  normalizeWeight(features: Feature<Geometry>[], weight: string): void {
    //https://www.statology.org/normalize-data-between-0-and-100/
    const weightValues = features.map((f) => parseInt(f.get(weight)));
    const min = Math.min(...weightValues);
    const max = Math.max(...weightValues);

    features.forEach((f) => {
      if (!f.get(NORMALIZED_WEIGHT_PROPERTY_NAME)) {
        const normalizedWeight = Math.ceil(
          ((f.get(weight) - min) / (max - min)) * 100
        );
        f.set(NORMALIZED_WEIGHT_PROPERTY_NAME, normalizedWeight);
      }
    });
  }
}

export default InterpolatedLayer;

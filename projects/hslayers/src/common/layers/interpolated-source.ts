import IDW from 'ol-ext/source/IDW';
import VectorSource, {LoadingStrategy} from 'ol/source/Vector';
import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {JET_COLOR_MAP} from './jet-color-map.const';
import {Projection} from 'ol/proj';
import {Subject} from 'rxjs';
import {containsExtent, equals} from 'ol/extent';

export const NORMALIZED_WEIGHT_PROPERTY_NAME = 'hs_normalized_IDW_value';

export interface InterpolatedSourceOptions {
  features?: Feature<Geometry>[];
  weight?: string;
  loader?(params: any): Promise<Feature[]>;
  colorMap?: ((v: number) => number[]) | string;
  strategy?: LoadingStrategy;
  maxFeaturesInExtent?: number;
  maxFeaturesInCache?: number;
}

export const colorMaps = {'jet': JET_COLOR_MAP};

export class InterpolatedSource extends IDW {
  featureCache: VectorSource = new VectorSource({});
  cancelUrlRequest: Subject<void> = new Subject();
  geoJSONFeatures: string[] = [];

  constructor(private options: InterpolatedSourceOptions) {
    super({
      // Source that contains the data
      source: new VectorSource({
        strategy:
          options.strategy != undefined
            ? options.strategy
            : (extent: number[], resolution) => {
                const extentCache = super
                  .getSource()
                  .loadedExtentsRtree_.getAll()
                  .map((item) => item.extent);
                const toRemove = extentCache.filter(
                  //Delete cached extents which contain this extent because they have their feature counts limited
                  (cachedExt) =>
                    !equals(cachedExt, extent) &&
                    containsExtent(cachedExt, extent)
                );
                for (const extToRemove of toRemove) {
                  super.getSource().removeLoadedExtent(extToRemove);
                }
                return [extent];
              },
        loader: async (extent, resolution, projection, success, failure) => {
          if (options.loader) {
            this.fillFeatures(
              await options.loader({
                extent,
                resolution,
                projection,
                success,
                failure,
              }),
              extent
            );
          }
        },
      }),
      weight: NORMALIZED_WEIGHT_PROPERTY_NAME,
    });
    if (options.colorMap) {
      if (typeof options.colorMap == 'string') {
        super.getColor = (v) => {
          const black = [0, 0, 0, 255];
          if (isNaN(v)) {
            return black;
          }
          if (v > 99) {
            v = 99;
          }
          if (v < 0) {
            v = 0;
          }
          v = Math.floor(v);
          return colorMaps[options.colorMap as string][v];
        };
      } else {
        super.getColor = options.colorMap;
      }
    }
    if (options.features) {
      this.fillFeatures(options.features);
    }
  }

  /**
   * Fill Interpolated source features
   * @param features - Parsed Ol features from get request
   * @param extent - Current map extent
   */
  fillFeatures(features: Feature<Geometry>[], extent?: number[]) {
    if (!features) {
      return;
    }
    const featsCached = this.featureCache.getFeatures();
    const cacheLimit = this.options.maxFeaturesInCache;
    if (cacheLimit < featsCached.length + features.length) {
      const cntToRemove = featsCached.length - (cacheLimit - features.length);
      featsCached
        .slice(0, cntToRemove)
        .forEach((f) => this.featureCache.removeFeature(f));
    }
    const countToAdd = cacheLimit ?? Number.MAX_VALUE;
    this.featureCache.addFeatures(features.slice(0, countToAdd));
    this.normalizeWeight(this.options.weight);
    const src = super.getSource();
    if (extent) {
      src.clear();
      const limitInExt = this.options.maxFeaturesInExtent ?? Number.MAX_VALUE;
      src.addFeatures(
        this.featureCache.getFeaturesInExtent(extent).slice(0, limitInExt)
      );
    } else {
      src.addFeatures(features);
    }
  }

  /**
   * Parse features from get request
   * @param collection - Get request response feature collection
   * @param mapProjection - Map projection
   */
  parseFeatures(collection: any, mapProjection: string | Projection): void {
    const dataProj = (collection.crs || collection.srs) ?? 'EPSG:4326';
    collection.features = collection.features.filter(
      (f) => !this.geoJSONFeatures.includes(f)
    );
    this.geoJSONFeatures = this.geoJSONFeatures.concat(collection.features);
    collection.features = new GeoJSON().readFeatures(collection, {
      dataProjection: dataProj,
      featureProjection: mapProjection,
    });
    collection.features = collection.features.filter((f) => {
      const value = f.get(this.options.weight);
      if (value && !isNaN(parseInt(value))) {
        return f;
      }
    });
    return collection.features;
  }

  /**
   * Create url for get request including current map extent
   * @param url - external source URL
   * @param extent - Current map extent
   */
  createIDWSourceUrl(url: string, extent: number[]): string {
    if (!url) {
      return;
    } else if (extent) {
      const extentObj = [
        {ref: 'minx', value: extent[0].toFixed(1)},
        {ref: 'miny', value: extent[1].toFixed(1)},
        {ref: 'maxx', value: extent[2].toFixed(1)},
        {ref: 'maxy', value: extent[3].toFixed(1)},
      ];
      const matches = url.match(/{.+?}/g);
      if (matches?.length > 0 && matches?.length <= 4) {
        for (const m of matches) {
          const ix = matches.indexOf(m);
          const key = m.replace(/[{}]/g, '').toLowerCase();
          const coord = extentObj.find((e) => e.ref === key) ?? extentObj[ix];
          url = url.replace(m, coord.value);
        }
      }
    }
    return url;
  }
  /**
   * Normalize weight values to be between 0 and 100
   * @param features - OL feature array
   * @param weight - Weight property name
   */
  normalizeWeight(weight: string): void {
    //https://www.statology.org/normalize-data-between-0-and-100/

    const features = this.featureCache.getFeatures();
    const weightValues = features.map((f) => parseInt(f.get(weight)));
    const min = Math.min(...weightValues);
    const max = Math.max(...weightValues);

    features.forEach((f) => {
      const normalizedWeight = Math.ceil(
        ((f.get(weight) - min) / (max - min)) * 99
      );
      f.set(NORMALIZED_WEIGHT_PROPERTY_NAME, normalizedWeight, true);
    });
  }
}

export default InterpolatedSource;

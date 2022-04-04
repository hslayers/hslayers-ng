import IDW from 'ol-ext/source/IDW';

import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {JET_COLOR_MAP} from './jet-color-map.const';
import {Projection} from 'ol/proj';
import {Subject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {containsExtent, equals} from 'ol/extent';

export const NORMALIZED_WEIGHT_PROPERTY_NAME = 'hs_normalized_IDW_value';

export interface InterpolatedSourceOptions {
  features?: Feature<Geometry>[];
  weight?: string;
  loader?(params: any): Promise<Feature[]>;
  setCustomColor?(v: number): number[];
}

export class InterpolatedSource extends IDW {
  featureCache: VectorSource = new VectorSource({});
  cancelUrlRequest: Subject<void> = new Subject();
  geoJSONFeatures: string[] = [];
  jetColorMap = JET_COLOR_MAP;
  constructor(private options: InterpolatedSourceOptions) {
    super({
      // Source that contains the data
      source: new VectorSource({
        strategy: (extent: number[], resolution) => {
          const extentCache = super
            .getSource()
            .loadedExtentsRtree_.getAll()
            .map((item) => item.extent);
          const toRemove = extentCache.filter(
            //Delete cached extents which contain this extent because they have their feature counts limited
            (cachedExt) =>
              !equals(cachedExt, extent) && containsExtent(cachedExt, extent)
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
      // Use val as weight property
      weight: NORMALIZED_WEIGHT_PROPERTY_NAME,
    });
    if (options.setCustomColor) {
      super.getColor = options.setCustomColor;
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
    this.featureCache.addFeatures(features);
    this.normalizeWeight(this.options.weight);
    if (extent) {
      super.getSource().clear();
      super
        .getSource()
        .addFeatures(this.featureCache.getFeaturesInExtent(extent));
    } else {
      super.getSource().addFeatures(features);
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
        ((f.get(weight) - min) / (max - min)) * 100
      );
      f.set(NORMALIZED_WEIGHT_PROPERTY_NAME, normalizedWeight);
    });
  }

  /**
   * Create vector layer to display weight values as point features
   * @param properties - Layer properties
   * @returns Vector layer
   */
  createVectorLayer(properties?: any): VectorLayer<VectorSource<Geometry>> {
    const props = {
      title: 'IDW layer source',
    };
    Object.assign(props, properties);
    return new VectorLayer({
      properties: props,
      source: super.getSource(),
      style: function (feature, resolution) {
        return [
          new Style({
            text: new Text({
              text: feature?.get(NORMALIZED_WEIGHT_PROPERTY_NAME)?.toString(),
              font: '12px Calibri,sans-serif',
              overflow: true,
              fill: new Fill({
                color: '#000',
              }),
              stroke: new Stroke({
                color: '#fff',
                width: 3,
              }),
            }),
          }),
        ];
      },
    });
  }
}

export default InterpolatedSource;

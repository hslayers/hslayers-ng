import IDW from 'ol-ext/source/IDW';

import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Projection} from 'ol/proj';
import {Subject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {containsExtent} from 'ol/extent';

import {InterpolatedSourceModel} from './interpolated-source.model';

export const NORMALIZED_WEIGHT_PROPERTY_NAME = 'hs_normalized_IDW_value';

type InterpolatedSourceOptions = {
  features?: Feature<Geometry>[];
  weight?: string;
};

export class InterpolatedSource extends IDW implements InterpolatedSourceModel {
  idwCacheSource: VectorSource<Geometry>;
  lastExtent: number[];
  cancelUrlRequest: Subject<void> = new Subject();
  constructor(options: InterpolatedSourceOptions) {
    super({
      // Source that contains the data
      source: new VectorSource({
        features: options.features,
      }),
      // Use val as weight property
      weight: options.weight ?? NORMALIZED_WEIGHT_PROPERTY_NAME,
    });
  }

  /**
   * Fill cache vectorsource with features from get request
   * @param collection - Get request response feature collection
   * @param mapProjection - Map projection
   * @param weight - Weight property name
   * @param extent - Current map extent
   */
  fillFeatures(
    collection: any,
    mapProjection: string | Projection,
    weight: string,
    extent?: number[]
  ): void {
    const dataProj = (collection.crs || collection.srs) ?? 'EPSG:4326';
    collection.features = new GeoJSON().readFeatures(collection, {
      dataProjection: dataProj,
      featureProjection: mapProjection,
    });
    collection.features = collection.features.filter((f) => {
      const value = f.get(weight);
      if (value && !isNaN(parseInt(value))) {
        return f;
      }
    });
    this.normalizeWeight(collection.features, weight);
    const cachedFeatures = this.idwCacheSource?.getFeatures();
    if (extent && this.lastExtent && cachedFeatures?.length > 0) {
      const filteredFeatures = collection.features.filter(
        (f) => !cachedFeatures.includes(f)
      );
      if (filteredFeatures?.length > 0) {
        this.idwCacheSource.addFeatures(filteredFeatures);
      }
    } else {
      this.idwCacheSource = new VectorSource({
        features: collection.features,
      });
    }
    this.lastExtent = extent ?? null;
    this.getFeaturesInExtent(extent);
  }

  /**
   * Add features to Interpolated source currently found inside the extent provided
   * @param extent - Current map extent
   */
  getFeaturesInExtent(extent: number[]): void {
    const features: Feature<Geometry>[] = [];
    this.idwCacheSource.forEachFeatureInExtent(extent, (feature) => {
      features.push(feature);
    });
    super.getSource().clear();
    super.getSource().addFeatures(features);
  }

  /**
   * Check if cached features are available to use
   * @param currentExtent - Current map extent
   */
  cacheAvailable(currentExtent: number[]): boolean {
    if (!this.lastExtent || !this.idwCacheSource) {
      return false;
    }
    return (
      containsExtent(currentExtent, this.lastExtent) &&
      this.idwCacheSource?.getFeatures()?.length > 0
    );
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

  /**
   * Create vector layer to display weight values as point features
   * @returns Vector layer
   */
  createVectorLayer(): VectorLayer<VectorSource<Geometry>> {
    return new VectorLayer({
      properties: {
        title: 'IDW layer source',
      },
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

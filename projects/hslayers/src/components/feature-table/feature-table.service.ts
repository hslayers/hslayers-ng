import {Injectable} from '@angular/core';

import {Cluster, Source} from 'ol/source';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsQueryVectorService} from './../query/query-vector.service';
import {HsUtilsService} from './../utils/utils.service';
import {
  getBase,
  getShowInLayerManager,
  getTitle,
} from '../../common/layer-extensions';

type FeatureDescriptor = {
  name: string;
  feature: Feature<Geometry>;
  attributes: {
    name;
    value;
    sanitizedValue?;
  }[];
  stats: any[];
};
class FeatureTableServiceParams {
  sortReverse = false; //trigger for reverse sorting
  lastSortValue = ''; //last sorting value selected
  features: FeatureDescriptor[] = []; //all feature attributes for html table
}
@Injectable({
  providedIn: 'root',
})
export class HsFeatureTableService {
  apps: {
    [id: string]: FeatureTableServiceParams;
  } = {default: new FeatureTableServiceParams()};
  constructor(
    private hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Get the params saved by the feature table service for the current app
   * @param app - App identifier
   */
  get(app: string): FeatureTableServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new FeatureTableServiceParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * @param layer - Layer from HsConfig.get(app).layersInFeatureTable
   * Checks if layer is vectorLayer and is visible in layer_manager, to exclude layers, such as, point Clicked
   * @returns Returns layer
   */
  addLayer(layer: Layer<Source>): any {
    if (
      !getBase(layer) &&
      this.hsUtilsService.instOf(layer, VectorLayer) &&
      (getShowInLayerManager(layer) === undefined ||
        getShowInLayerManager(layer) == true)
    ) {
      return this.wrapLayer(layer);
    }
    return;
  }
  /**
   * @param layer - Layer from HsConfig.get(app).layersInFeatureTable
   * Wrap layer object
   * @returns Returns wrapped layer object
   */
  wrapLayer(layer: Layer<Source>): any {
    return {
      title: getTitle(layer),
      lyr: layer,
      type: 'vector',
    };
  }
  /**
   * @param layer - Layer from HsConfig.get(app).layersInFeatureTable
   * @param app - App identifier
   * Search all layers feature attributes and map them into new objects for html table
   */
  fillFeatureList(layer: Layer<Source>, app: string): void {
    const source: VectorSource<Geometry> =
      this.hsLayerUtilsService.isLayerClustered(layer)
        ? (layer.getSource() as Cluster).getSource()
        : (layer.getSource() as VectorSource<Geometry>);
    this.get(app).features = source
      .getFeatures()
      .map((f) => this.describeFeature(f, app))
      .filter((f) => f?.attributes?.length > 0);
  }

  /**
   * @param feature - Feature selected
   * @param app - App identifier
   * Update feature description
   */
  updateFeatureDescription(feature: Feature<Geometry>, app: string): void {
    const appRef = this.get(app);
    const newDescriptor = this.describeFeature(feature, app);
    const currentIx = appRef.features.findIndex((f) => f.feature == feature);
    if (newDescriptor && currentIx > -1) {
      appRef.features[currentIx] = newDescriptor;
    }
  }

  /**
   * @param feature - Feature selected
   * @param app - App identifier
   * Add feature description
   */
  addFeatureDescription(feature: Feature<Geometry>, app: string): void {
    const newDescriptor = this.describeFeature(feature, app);
    if (newDescriptor) {
      this.get(app).features.push(newDescriptor);
    }
  }

  /**
   * @param feature - Feature selected
   * @param app - App identifier
   * Remove feature description
   */
  removeFeatureDescription(feature: Feature<Geometry>, app: string): void {
    const appRef = this.get(app);
    const currentIx = appRef.features.findIndex((f) => f.feature == feature);
    if (currentIx > -1) {
      appRef.features.splice(currentIx, 1);
    }
  }

  /**
   * @param feature - Feature selected
   * @param app - App identifier
   * Describe feature
   */
  describeFeature(feature: Feature<Geometry>, app: string): FeatureDescriptor {
    const attribWrapper = this.hsQueryVectorService
      .getFeatureAttributes(feature, app)
      .pop();
    if (!attribWrapper) {
      return null;
    }
    return {
      name: this.setFeatureName(attribWrapper.attributes),
      feature,
      attributes: this.attributesWithoutFeatureName(attribWrapper.attributes),
      stats: attribWrapper.stats,
    };
  }

  /**
   * @param attributes - layers feature attributes
   * Find feature name attribute and seperate it from other attributes for html table purposes
   * @returns feature name
   */
  setFeatureName(attributes: any): string {
    if (attributes.length > 0) {
      let name = 'Feature';
      for (const attribute of attributes) {
        if (attribute.name === 'name') {
          name = attribute.value;
        }
      }
      return name;
    } else {
      return 'Feature';
    }
  }
  /**
   * @param attributes - layers feature attributes
   * Remove feature name attribute from feature attributes array
   * @returns feature attributes
   */
  attributesWithoutFeatureName(attributes: any): any {
    return attributes.filter((attr) => attr.name !== 'name');
  }
  /**
   * @param valueName - Requested value to sort the feature table list
   * @param app - App identifier
   * Sort features by requested value
   */
  sortFeaturesBy(valueName, app: string): void {
    const appRef = this.get(app);
    if (appRef.features !== undefined && appRef.features.length > 1) {
      appRef.lastSortValue === valueName //if last sort by value is the same as current sort table list in reverse
        ? (appRef.sortReverse = !appRef.sortReverse)
        : (appRef.sortReverse = false);
      appRef.features = appRef.features.sort((a, b) =>
        this.sortFeatures(a, b, valueName, app)
      );
    }
  }
  /**
   * @param a - First input feature
   * @param b - second input feature
   * @param valueName - Sorting value
   * @param app - App identifier
   * Sorting algorithm
   * @returns Returns each features relative position in the table
   */
  sortFeatures(a, b, valueName, app: string): number {
    const appRef = this.get(app);
    let aFeature, bFeature: any;
    let position: number;
    if (valueName === 'name') {
      //check if table is being sorted by name
      aFeature = a[valueName];
      bFeature = b[valueName];
    } else {
      aFeature = this.getValue(a.attributes, valueName); //get requested attribute value
      bFeature = this.getValue(b.attributes, valueName);
    }
    if (aFeature === null) {
      position = 1;
    }
    if (bFeature === null) {
      position = -1;
    }
    if (typeof aFeature == 'string' && typeof bFeature == 'string') {
      position =
        aFeature.charAt(0) > bFeature.charAt(0)
          ? 1
          : aFeature.charAt(0) < bFeature.charAt(0)
          ? -1
          : 0;
    }
    if (typeof aFeature == 'number' && typeof bFeature == 'number') {
      position = aFeature - bFeature;
    }
    appRef.sortReverse ? (position = position * -1) : position;
    appRef.lastSortValue = valueName;
    return position;
  }
  /**
   * @param attributes - features attributes
   * @param valueName - Sorting value
   * Get requested features attribute value, which will be used in the sorting algorithm
   * @returns Returns attributes value
   */
  getValue(attributes: any, valueName: string): string | number {
    let value = attributes //get requested attribute value
      .filter((attr) => attr.name == valueName)
      .map((attr) => attr.value);
    if (value.length == 0 || value === undefined) {
      value = null;
    } else {
      value = value[0];
    }
    return value;
  }
}

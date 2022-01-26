import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import {Injectable} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';

import {Cluster, Source} from 'ol/source';
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

@Injectable({
  providedIn: 'root',
})
export class HsFeatureTableService {
  sortReverse = false; //trigger for reverse sorting
  lastSortValue = ''; //last sorting value selected
  features: FeatureDescriptor[] = []; //all feature attributes for html table
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsLanguageService: HsLanguageService
  ) {}
  /**
   * Checks if layer is vectorLayer and is visible in layer_manager, to exclude layers, such as, point Clicked
   * @param layer - Layer from HsConfig.layersInFeatureTable
   * @returns Returns layer
   */
  addLayer(layer: Layer<Source, any>): any {
    if (
      !getBase(layer) &&
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (getShowInLayerManager(layer) === undefined ||
        getShowInLayerManager(layer) == true)
    ) {
      return this.wrapLayer(layer);
    }
    return;
  }
  /**
   * Wrap layer object
   * @param layer - Layer from HsConfig.layersInFeatureTable
   * @returns Returns wrapped layer object
   */
  wrapLayer(layer: Layer<Source, any>): any {
    return {
      title: getTitle(layer),
      lyr: layer,
      type: 'vector',
    };
  }
  /**
   * Search all layers feature attributes and map them into new objects for html table
   * @param layer - Layer from HsConfig.layersInFeatureTable
   */
  fillFeatureList(layer: Layer<Source, any>): void {
    const source: VectorSource<Geometry> =
      this.HsLayerUtilsService.isLayerClustered(layer)
        ? (layer.getSource() as Cluster).getSource()
        : (layer.getSource() as VectorSource<Geometry>);
    this.features = source
      .getFeatures()
      .map((f) => this.describeFeature(f))
      .filter((f) => f?.attributes?.length > 0);
  }

  updateFeatureDescription(feature: Feature<Geometry>): void {
    const newDescriptor = this.describeFeature(feature);
    const currentIx = this.features.findIndex((f) => f.feature == feature);
    if (newDescriptor && currentIx > -1) {
      this.features[currentIx] = newDescriptor;
    }
  }

  addFeatureDescription(feature: Feature<Geometry>): void {
    const newDescriptor = this.describeFeature(feature);
    if (newDescriptor) {
      this.features.push(newDescriptor);
    }
  }

  removeFeatureDescription(feature: Feature<Geometry>): void {
    const currentIx = this.features.findIndex((f) => f.feature == feature);
    if (currentIx > -1) {
      this.features.splice(currentIx, 1);
    }
  }

  describeFeature(feature: Feature<Geometry>): FeatureDescriptor {
    const attribWrapper =
      this.HsQueryVectorService.getFeatureAttributes(feature).pop();
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
   * @param attributes layers feature attributes
   * @description Find feature name attribute and seperate it from other attributes for html table purposes
   * @returns {any} feature name
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
   * @param attributes layers feature attributes
   * @description Remove feature name attribute from feature attributes array
   * @returns {any} feature attributes
   */
  attributesWithoutFeatureName(attributes: any): any {
    return attributes.filter((attr) => attr.name !== 'name');
  }
  /**
   * @param valueName Requested value to sort the feature table list
   * @description Sort features by requested value
   */
  sortFeaturesBy(valueName): void {
    if (this.features !== undefined && this.features.length > 1) {
      this.lastSortValue === valueName //if last sort by value is the same as current sort table list in reverse
        ? (this.sortReverse = !this.sortReverse)
        : (this.sortReverse = false);
      this.features = this.features.sort((a, b) =>
        this.sortFeatures(a, b, valueName)
      );
    }
  }
  /**
   * @param a First input feature
   * @param b second input feature
   * @param valueName Sorting value
   * @description Sorting algorithm
   * @returns {number} Returns each features relative position in the table
   */
  sortFeatures(a, b, valueName): number {
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
    this.sortReverse ? (position = position * -1) : position;
    this.lastSortValue = valueName;
    return position;
  }
  /**
   * @param attributes features attributes
   * @param valueName Sorting value
   * @description Get requested features attribute value, which will be used in the sorting algorithm
   * @returns {number | string} Returns attributes value
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

  translate(text: string): string {
    const translation: string =
      this.HsLanguageService.getTranslationIgnoreNonExisting(
        'FEATURE_TABLE',
        text
      );
    return translation;
  }
}

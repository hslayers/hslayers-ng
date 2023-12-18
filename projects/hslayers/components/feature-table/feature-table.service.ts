import {Injectable} from '@angular/core';

import {Cluster, Source, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';

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
  /**
   * Trigger for reverse sorting
   */
  sortReverse = false;
  /**
   * Last sorting value selected
   */
  lastSortValue = '';
  /**
   * all feature attributes for HTML table
   */
  features: FeatureDescriptor[] = [];
  constructor(
    private hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsQueryVectorService: HsQueryVectorService,
  ) {}

  /**
   * Checks if layer is vectorLayer and is visible in layer_manager, to exclude layers, such as, point Clicked
   *
   * @param layer - Layer from HsConfig.layersInFeatureTable
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
   * Wrap layer object
   *
   * @param layer - Layer from HsConfig.layersInFeatureTable
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
   * Search all layers feature attributes and map them into new objects for html table
   *
   * @param layer - Layer from HsConfig.layersInFeatureTable
   */
  fillFeatureList(layer: Layer<Source>): void {
    const source: VectorSource = this.hsLayerUtilsService.isLayerClustered(
      layer,
    )
      ? (layer.getSource() as Cluster).getSource()
      : (layer.getSource() as VectorSource);
    this.features = source
      .getFeatures()
      .map((f) => this.describeFeature(f))
      .filter((f) => f?.attributes?.length > 0);
  }

  /**
   * Update feature description
   *
   * @param feature - Feature selected
   */
  updateFeatureDescription(feature: Feature<Geometry>): void {
    const newDescriptor = this.describeFeature(feature);
    const currentIx = this.features.findIndex((f) => f.feature == feature);
    if (newDescriptor && currentIx > -1) {
      this.features[currentIx] = newDescriptor;
    }
  }

  /**
   * Add feature description
   *
   * @param feature - Feature selected
   */
  addFeatureDescription(feature: Feature<Geometry>): void {
    const newDescriptor = this.describeFeature(feature);
    if (newDescriptor) {
      this.features.push(newDescriptor);
    }
  }

  /**
   * Remove feature description
   *
   * @param feature - Feature selected
   */
  removeFeatureDescription(feature: Feature<Geometry>): void {
    const currentIx = this.features.findIndex((f) => f.feature == feature);
    if (currentIx > -1) {
      this.features.splice(currentIx, 1);
    }
  }

  /**
   * Describe feature
   *
   * @param feature - Feature selected
   */
  describeFeature(feature: Feature<Geometry>): FeatureDescriptor {
    const attribWrapper = this.hsQueryVectorService
      .getFeatureAttributes(feature)
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
   * Find feature name attribute and separate it from other attributes for html table purposes
   *
   * @param attributes - layers feature attributes
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
   * Remove feature name attribute from feature attributes array
   *
   * @param attributes - layers feature attributes
   * @returns feature attributes
   */
  attributesWithoutFeatureName(attributes: any): any {
    return attributes.filter((attr) => attr.name !== 'name');
  }

  /**
   * Sort features by requested value
   *
   * @param valueName - Requested value to sort the feature table list
   */
  sortFeaturesBy(valueName): void {
    if (this.features !== undefined && this.features.length > 1) {
      this.lastSortValue === valueName //if last sort by value is the same as current sort table list in reverse
        ? (this.sortReverse = !this.sortReverse)
        : (this.sortReverse = false);
      this.features = this.features.sort((a, b) =>
        this.sortFeatures(a, b, valueName),
      );
    }
  }

  /**
   * Sorting algorithm
   *
   * @param a - First input feature
   * @param b - second input feature
   * @param valueName - Sorting value
   * @returns Returns each features relative position in the table
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
   * Get requested features attribute value, which will be used in the sorting algorithm
   *
   * @param attributes - features attributes
   * @param valueName - Sorting value
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

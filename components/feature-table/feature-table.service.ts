/* eslint-disable @typescript-eslint/no-unused-vars */
import VectorLayer from 'ol/layer/Vector';
import {HsQueryVectorService} from './../query/query-vector.service';
import {HsUtilsService} from './../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
@Injectable({
  providedIn: 'root',
})
export class HsFeatureTableService {
  // sortingByButtonList: any; //array filled with unique feature attribute names for sorting
  sortReverse = false; //trigger for reverse sorting
  lastSortValue = ''; //last sorting value selected
  featureAttributeList: any = []; //all feature attributes for html table
  constructor(
    private HsUtilsService: HsUtilsService,
    private HsQueryVectorService: HsQueryVectorService
  ) {}
  /**
   * @param layer Layer from HsConfig.layersInFeatureTable
   * @ngdoc method
   * @name HsFeatureTableService#addLayer
   * @description Checks if layer is vectorLayer and is visible in layer_manager, to exclude layers, such as, point Clicked
   * @returns {any} Returns layer
   */
  addLayer(layer: Layer): any {
    if (
      !layer.get('base') &&
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (layer.get('show_in_manager') === undefined ||
        layer.get('show_in_manager') == true)
    ) {
      return this.wrapLayer(layer);
    }
    return;
  }
  /**
   * @param layer Layer from HsConfig.layersInFeatureTable
   * @ngdoc method
   * @name HsFeatureTableService#wrapLayer
   * @description Wrap layer object
   * @returns {any} Returns wrapped layer object
   */
  wrapLayer(layer: Layer): any {
    return {
      title: layer.get('title'),
      lyr: layer,
      type: 'vector',
    };
  }
  /**
   * @param layer Layer from HsConfig.layersInFeatureTable
   * @ngdoc method
   * @name HsFeatureTableService#getFeatureAttributes
   * @description Search all layers feature attributes and map them into new objects for html table
   */
  getFeatureAttributes(layer: Layer): void {
    let features = [];
    const featureAttributes = [];
    //this.sortingByButtonList = ['name'];
    if (layer.getSource().getSource) {
      features = layer.getSource().getSource().getFeatures();
    } else {
      features = layer.getSource().getFeatures();
    }
    if (features.length) {
      for (const feature of features) {
        let attributesFromQuery = this.HsQueryVectorService.getFeatureAttributes(
          feature
        );
        if (attributesFromQuery.length) {
          attributesFromQuery = attributesFromQuery.map((attr) => {
            return {
              name: this.setFeatureName(attr.attributes),
              attributes: this.attributesWithoutFeatureName(attr.attributes),
              // feature: attr.feature,
              stats: attr.stats,
            };
          });
          attributesFromQuery = attributesFromQuery[0];
          featureAttributes.push(attributesFromQuery);
          //this.ceateSortingValueArray(attributesFromQuery);
        }
      }
      this.featureAttributeList = featureAttributes;
    }
  }
  /**
   * @param attributes layers feature attributes
   * @ngdoc method
   * @name HsFeatureTableService#setFeatureName
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
   * @ngdoc method
   * @name HsFeatureTableService#attributesWithoutFeatureName
   * @description Remove feature name attribute from feature attributes array
   * @returns {any} feature attributes
   */
  attributesWithoutFeatureName(attributes: any): any {
    return attributes.filter((attr) => attr.name !== 'name');
  }
  /**
   * @param feature layers feature from this.featureAttributeList
   * @ngdoc method
   * @name HsFeatureTableService#ceateSortingValueArray
   * @description Create sorting value array from all layers features
   */
  // ceateSortingValueArray(feature): void {
  //   if (feature?.attributes && feature.attributes.length > 0) {
  //     this.getSortingValueNames(feature.attributes);
  //   }
  // }
  /**
   * @param attributes features attributes array
   * @ngdoc method
   * @name HsFeatureTableService#getSortingValueNames
   * @description get sorting values from each individual feature attributes, if value does not already exist in the this.sortingByButtonList array
   */
  // getSortingValueNames(attributes: Array<unknown>): void {
  //   if (Array.isArray(attributes)) {
  //     for (const attribute of attributes) {
  //       if (
  //         this.sortingByButtonList.length > 0 &&
  //         this.sortingByButtonList !== undefined
  //       ) {
  //         this.sortingByButtonList.filter((name) => name === attribute.name)
  //           .length == 0
  //           ? this.sortingByButtonList.push(attribute.name)
  //           : [];
  //       } else {
  //         this.sortingByButtonList.push(attribute.name);
  //       }
  //     }
  //   }
  // }
  /**
   * @param valueName Requested value to sort the feature table list
   * @ngdoc method
   * @name HsFeatureTableService#sortFeaturesBy
   * @description Sort features by requested value
   */
  sortFeaturesBy(valueName): void {
    if (
      this.featureAttributeList !== undefined &&
      this.featureAttributeList.length > 1
    ) {
      this.lastSortValue === valueName //if last sort by value is the same as current sort table list in reverse
        ? (this.sortReverse = !this.sortReverse)
        : (this.sortReverse = false);
      this.featureAttributeList = this.featureAttributeList.sort((a, b) =>
        this.sortFeatures(a, b, valueName)
      );
    }
  }
  /**
   * @param a First input feature
   * @param b second input feature
   * @param valueName Sorting value
   * @ngdoc method
   * @name HsFeatureTableService#sortFeatures
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
   * @ngdoc method
   * @name HsFeatureTableService#getValue
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
}

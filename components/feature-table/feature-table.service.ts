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
   * @returns {any} Array of feature attributes
   */
  getFeatureAttributes(layer: Layer): any {
    let features = [];
    const featureAttributes = [];
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
        }
      }
      return featureAttributes;
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
}

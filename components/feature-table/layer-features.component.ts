/* eslint-disable @typescript-eslint/no-unused-vars */
import Feature from 'ol/Feature';
import {Component, Input, OnInit} from '@angular/core';
import {HsFeatureTableService} from './feature-table.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';

type Operation = {
  action: 'zoom to' | 'delete';
  feature: Feature;
};

/**
 * @memberof hs.layerFeatures
 * @ngdoc component
 * @name HsLayerFeaturesComponent
 */
@Component({
  selector: 'hs-layer-features',
  template: require('./partials/layer-features.html'),
  styles: [
    `
      td,
      th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 6px;
        font-size: 14px;
      }
      .tdbreak {
        overflow-wrap: break-word;
        word-break: break-word;
      }
    `,
  ],
})
export class HsLayerFeaturesComponent implements OnInit {
  @Input('layer') layer: any; //Input layer from HsConfig.layersInFeatureTable property array
  featureAttributes: any = []; //mapped each layer features attribute array
  showFeatureStats = false; //Toggle for showing feature statistics
  searchedFeatures = '';
  sortReverse = false;
  lastSortValue = '';
  constructor(
    private HsFeatureTableService: HsFeatureTableService,
    private HsUtilsService: HsUtilsService,
    private HsMapService: HsMapService
  ) {}
  /**
   * @ngdoc method
   * @name HsLayerFeaturesComponent#ngOnInit
   * @public
   * @description Activate listeners for any layer source changes to update the html table
   */
  ngOnInit(): void {
    const olLayer = this.layer.lyr;
    if (olLayer.getSource()) {
      this.getFeatureAttributes(olLayer);
      const source = olLayer.getSource();
      const changeHandler = this.HsUtilsService.debounce(
        (e) => {
          this.getFeatureAttributes(olLayer);
        },
        200,
        false,
        this
      );
      source.on('changefeature', changeHandler);
      source.on('addfeature', changeHandler);
      source.on('removefeature', changeHandler);
    }
  }
  /**
   * @param layer
   * @ngdoc method
   * @name HsLayerFeaturesComponent#getFeatureAttributes
   * @public
   * @description Get all layer feature attributes and stats
   */
  getFeatureAttributes(layer: Layer) {
    const layerFeatureAttributes = this.HsFeatureTableService.getFeatureAttributes(
      layer
    );
    if (layerFeatureAttributes) {
      this.featureAttributes = layerFeatureAttributes;
    }
  }
  executeOperation(operation: Operation): void {
    switch (operation.action) {
      case 'zoom to':
        const extent = operation.feature.getGeometry().getExtent();
        this.HsMapService.map
          .getView()
          .fit(extent, this.HsMapService.map.getSize());
        break;
      default:
    }
  }
  zoomToFeature(feature) {
    console.log('Zooming' + feature.name);
  }
  sortFeaturesBy(valueName) {
    if (
      this.featureAttributes !== undefined &&
      this.featureAttributes.length > 1
    ) {
      this.lastSortValue === valueName //if last sort by value is the same as current sort table list in reverse
        ? (this.sortReverse = !this.sortReverse)
        : (this.sortReverse = false);
      this.featureAttributes = this.featureAttributes.sort((a, b) => {
        let aFeature, bFeature: any;
        let position: number;
        if (valueName === 'name') {
          //check if table is being sorted by name
          aFeature = a[valueName];
          bFeature = b[valueName];
        } else {
          aFeature = this.getSortingValue(a.attributes, valueName); //get requested attribute value
          bFeature = this.getSortingValue(b.attributes, valueName);
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
        return position;
      });
      this.lastSortValue = valueName;
    }
  }
  getSortingValue(attributes: any, valueName: string): string | number {
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

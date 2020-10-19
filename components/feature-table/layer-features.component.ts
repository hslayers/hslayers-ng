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
      this.HsFeatureTableService.getFeatureAttributes(olLayer);
      const source = olLayer.getSource();
      const changeHandler = this.HsUtilsService.debounce(
        (e) => {
          this.HsFeatureTableService.getFeatureAttributes(olLayer);
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
}

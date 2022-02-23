import {Component, Input, OnInit} from '@angular/core';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';

import {HsFeatureTableService} from './feature-table.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';

type Operation = {
  action: 'zoom to' | 'delete' | 'custom action';
  feature: Feature<Geometry>;
  customActionName?: string;
  customAction?: any;
};

@Component({
  selector: 'hs-layer-features',
  templateUrl: './partials/layer-features.html',
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
  @Input('layer') layer: any; //Input layer from HsConfig.get(app).layersInFeatureTable property array
  showFeatureStats = false; //Toggle for showing feature statistics
  searchedFeatures = '';
  constructor(
    public HsFeatureTableService: HsFeatureTableService,
    public HsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public HsLanguageService: HsLanguageService,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {}
  /**
   * @public
   * @description Activate listeners for any layer source changes to update the html table
   */
  ngOnInit(): void {
    const olLayer = this.layer.lyr;
    const source = this.HsLayerUtilsService.isLayerClustered(olLayer)
      ? olLayer.getSource().getSource()
      : olLayer.getSource();
    if (source) {
      this.HsFeatureTableService.fillFeatureList(olLayer);
      source.on('changefeature', (e) => {
        this.HsFeatureTableService.updateFeatureDescription(e.feature);
      });
      source.on('addfeature', (e) => {
        this.HsFeatureTableService.addFeatureDescription(e.feature);
      });
      source.on('removefeature', (e) => {
        this.HsFeatureTableService.removeFeatureDescription(e.feature);
      });
    }
  }
  /**
   * @param operation Action for html table
   * @public
   * @description zoom to feature from html table after triggering zoom action
   */
  executeOperation(operation: Operation): void {
    switch (operation.action) {
      case 'zoom to':
        const extent = operation.feature.getGeometry().getExtent();
        this.HsMapService.fitExtent(extent);
        break;
      case 'custom action':
        operation.customAction(operation.feature);
        break;
      default:
    }
  }
}

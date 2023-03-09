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
  templateUrl: './partials/layer-features.component.html',
  styles: [
    `
      td,
      th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 6px;
        font-size: 0.875rem;
      }
      .tdbreak {
        overflow-wrap: break-word;
        word-break: break-word;
      }
    `,
  ],
})
export class HsLayerFeaturesComponent implements OnInit {
  @Input() layer: any; //Input layer from HsConfig.layersInFeatureTable property array
  showFeatureStats = false; //Toggle for showing feature statistics
  searchedFeatures = '';
  constructor(
    public hsFeatureTableService: HsFeatureTableService,
    public hsUtilsService: HsUtilsService,
    public hsMapService: HsMapService,
    public hsLanguageService: HsLanguageService,
    public hsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {}
  /**
   * Activate listeners for any layer source changes to update the html table
   */
  ngOnInit(): void {
    const olLayer = this.layer.lyr;
    const source = this.hsLayerUtilsService.isLayerClustered(olLayer)
      ? olLayer.getSource().getSource()
      : olLayer.getSource();
    if (source) {
      this.hsFeatureTableService.fillFeatureList(olLayer);
      source.on('changefeature', (e) => {
        this.hsFeatureTableService.updateFeatureDescription(e.feature);
      });
      source.on('addfeature', (e) => {
        this.hsFeatureTableService.addFeatureDescription(e.feature);
      });
      source.on('removefeature', (e) => {
        this.hsFeatureTableService.removeFeatureDescription(e.feature);
      });
    }
  }
  /**
   * @param operation - Action for html table
   * @public
   * zoom to feature from html table after triggering zoom action
   */
  executeOperation(operation: Operation): void {
    switch (operation.action) {
      case 'zoom to':
        const extent = operation.feature.getGeometry().getExtent();
        this.hsMapService.fitExtent(extent);
        break;
      case 'custom action':
        operation.customAction(operation.feature);
        break;
      default:
    }
  }

  /**
   * @param text - Text to translate to locale
   
   * Translate provided text to selected locale language
   * @returns Returns translation
   */
  translate(text: string): string {
    const translation: string =
      this.hsLanguageService.getTranslationIgnoreNonExisting(
        'FEATURE_TABLE',
        text,
        undefined
      );
    return translation;
  }

  /**
   * @param name - Sort value
   * Sort features by value
   */
  sortFeaturesBy(name: string): void {
    this.hsFeatureTableService.sortFeaturesBy(name);
  }
}

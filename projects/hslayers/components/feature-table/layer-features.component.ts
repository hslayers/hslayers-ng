import {Component, Input, OnInit} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureTableService} from './feature-table.service';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsUtilsService} from 'hslayers-ng/services/utils';

type Operation = {
  action: 'zoom to' | 'delete' | 'custom action';
  feature: Feature<Geometry>;
  customActionName?: string;
  customAction?: any;
};

@Component({
  selector: 'hs-layer-features',
  templateUrl: './layer-features.component.html',
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
  /**
   * Input layer from HsConfig.layersInFeatureTable property array
   */
  @Input() layer: any;
  /**
   * Toggle for showing feature statistics
   */
  showFeatureStats = false;
  searchedFeatures = '';
  constructor(
    public hsFeatureTableService: HsFeatureTableService,
    public hsUtilsService: HsUtilsService,
    public hsMapService: HsMapService,
    public hsLanguageService: HsLanguageService,
    public hsLayerUtilsService: HsLayerUtilsService,
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
   * Zoom to feature from HTML table after triggering zoom action
   * @param operation - Action for HTML table
   * @public
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
   * Translate provided text to selected locale language
   * @param text - Text to translate to locale
   * @returns Returns translation
   */
  translate(text: string): string {
    const translation: string =
      this.hsLanguageService.getTranslationIgnoreNonExisting(
        'FEATURE_TABLE',
        text,
        undefined,
      );
    return translation;
  }

  /**
   * Sort features by value
   * @param name - Sort value
   */
  sortFeaturesBy(name: string): void {
    this.hsFeatureTableService.sortFeaturesBy(name);
  }
}

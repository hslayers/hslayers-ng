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
  @Input() layer: any; //Input layer from HsConfig.get(app).layersInFeatureTable property array
  @Input() app = 'default';
  showFeatureStats = false; //Toggle for showing feature statistics
  searchedFeatures = '';
  appRef;
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
      this.hsFeatureTableService.fillFeatureList(olLayer, this.app);
      source.on('changefeature', (e) => {
        this.hsFeatureTableService.updateFeatureDescription(
          e.feature,
          this.app
        );
      });
      source.on('addfeature', (e) => {
        this.hsFeatureTableService.addFeatureDescription(e.feature, this.app);
      });
      source.on('removefeature', (e) => {
        this.hsFeatureTableService.removeFeatureDescription(
          e.feature,
          this.app
        );
      });
    }
    this.appRef = this.hsFeatureTableService.get(this.app);
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
        this.hsMapService.fitExtent(extent, this.app);
        break;
      case 'custom action':
        operation.customAction(operation.feature);
        break;
      default:
    }
  }

  /**
   * Get title translation
   * @param title - Title to translate
   */
  translateTitle(title: string): string {
    return this.hsLayerUtilsService.translateTitle(title, this.app);
  }

  /**
   * @param text - Text to translate to locale
   * @param app - App identifier
   * Translate provided text to selected locale language
   * @returns Returns translation
   */
  translate(text: string): string {
    const translation: string =
      this.hsLanguageService.getTranslationIgnoreNonExisting(
        'FEATURE_TABLE',
        text,
        undefined,
        this.app
      );
    return translation;
  }

  /**
   * @param name - Sort value
   * Sort features by value
   */
  sortFeaturesBy(name: string): void {
    this.hsFeatureTableService.sortFeaturesBy(name, this.app);
  }
}

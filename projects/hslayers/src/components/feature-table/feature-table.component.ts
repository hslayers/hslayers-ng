import {Component, OnInit} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-feature-table',
  templateUrl: './partials/feature-table.component.html',
})
export class HsFeatureTableComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  layers: VectorLayer<VectorSource<Geometry>>[] = [];
  name = 'feature_table';
  constructor(
    private hsFeatureTableService: HsFeatureTableService,
    private hsConfig: HsConfig,
    private hsMapService: HsMapService,
    hsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
  }
  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'feature_table',
        module: 'hs.feature-table',
        order: 14,
        fits: true,
        title: 'PANEL_HEADER.FEATURE_TABLE',
        description: 'SIDEBAR.descriptions.FEATURE_TABLE',
        icon: 'indexmanager',
      },
      
    );
    this.hsMapService.loaded().then(() => {
      for (const layer of this.hsConfig
        .layersInFeatureTable || []) {
        this.addLayerToTable(layer);
      }
    });
  }

  /**
   * @param layer - Layer to add
   * Add layer to feature description table
   */
  addLayerToTable(layer: VectorLayer<VectorSource<Geometry>>): void {
    const layerDescriptor = this.hsFeatureTableService.addLayer(layer);
    if (layerDescriptor) {
      this.layers.push(layerDescriptor);
    }
  }
}

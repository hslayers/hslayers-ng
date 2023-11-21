import {Component, OnInit} from '@angular/core';

import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-feature-table',
  templateUrl: './feature-table.component.html',
})
export class HsFeatureTableComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  layers: VectorLayer<VectorSource>[] = [];
  name = 'feature_table';
  constructor(
    private hsFeatureTableService: HsFeatureTableService,
    private hsConfig: HsConfig,
    private hsMapService: HsMapService,
    public hsLayoutService: HsLayoutService,
    private hsSidebarService: HsSidebarService,
  ) {
    super(hsLayoutService);
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton({
      panel: 'feature_table',
      module: 'hs.feature-table',
      order: 14,
      fits: true,
      title: 'PANEL_HEADER.FEATURE_TABLE',
      description: 'SIDEBAR.descriptions.FEATURE_TABLE',
      icon: 'icon-indexmanager',
    });
    this.hsMapService.loaded().then(() => {
      for (const layer of this.hsConfig.layersInFeatureTable || []) {
        this.addLayerToTable(layer);
      }
    });
  }

  /**
   * Add layer to feature description table
   * @param layer - Layer to add
   */
  addLayerToTable(layer: VectorLayer<VectorSource>): void {
    const layerDescriptor = this.hsFeatureTableService.addLayer(layer);
    if (layerDescriptor) {
      this.layers.push(layerDescriptor);
    }
  }
}

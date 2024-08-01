import {Component, OnInit} from '@angular/core';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsFeatureTableService} from './feature-table.service';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

@Component({
  selector: 'hs-feature-table',
  templateUrl: './feature-table.component.html',
})
export class HsFeatureTableComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  layers: VectorLayer<VectorSource<Feature>>[] = [];
  name = 'feature-table';
  constructor(
    private hsFeatureTableService: HsFeatureTableService,
    private hsConfig: HsConfig,
    private hsMapService: HsMapService,
    private hsSidebarService: HsSidebarService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton({
      panel: 'featureTable',
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
  addLayerToTable(layer: VectorLayer<VectorSource<Feature>>): void {
    const layerDescriptor = this.hsFeatureTableService.addLayer(layer);
    if (layerDescriptor) {
      this.layers.push(layerDescriptor);
    }
  }
}

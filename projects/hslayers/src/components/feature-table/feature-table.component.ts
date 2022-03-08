import {Component, OnInit} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from './../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-feature-table',
  templateUrl: './partials/feature-table.html',
})
export class HsFeatureTableComponent
  extends HsPanelBaseComponent
  implements OnInit {
  layers: VectorLayer<VectorSource<Geometry>>[] = [];
  name = 'feature_table';
  constructor(
    public HsFeatureTableService: HsFeatureTableService,
    public HsConfig: HsConfig,
    public HsMapService: HsMapService,
    hsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService
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
        title: () =>
          this.hsLanguageService.getTranslation(
            'PANEL_HEADER.FEATURE_TABLE',
            undefined,
            this.data.app
          ),
        description: () =>
          this.hsLanguageService.getTranslation(
            'SIDEBAR.descriptions.FEATURE_TABLE',
            undefined,
            this.data.app
          ),
        icon: 'icon-indexmanager',
      },
      this.data.app
    );
    this.HsMapService.loaded(this.data.app).then(() => {
      for (const layer of this.HsConfig.get(this.data.app)
        .layersInFeatureTable || []) {
        this.addLayerToTable(layer);
      }
    });
  }
  addLayerToTable(layer: VectorLayer<VectorSource<Geometry>>): void {
    const layerDescriptor = this.HsFeatureTableService.addLayer(layer);
    if (layerDescriptor) {
      this.layers.push(layerDescriptor);
    }
  }
}

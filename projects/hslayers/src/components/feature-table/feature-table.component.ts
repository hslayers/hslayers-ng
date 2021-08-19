import {Component, OnInit} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {HsMapService} from './../map/map.service';

@Component({
  selector: 'hs-feature-table',
  templateUrl: './partials/feature-table.html',
})
export class HsFeatureTableComponent implements OnInit {
  layers: VectorLayer<VectorSource<Geometry>>[] = [];
  constructor(
    public HsFeatureTableService: HsFeatureTableService,
    public HsConfig: HsConfig,
    public HsMapService: HsMapService
  ) {}
  ngOnInit(): void {
    this.HsMapService.loaded().then(() => {
      for (const layer of this.HsConfig.layersInFeatureTable || []) {
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

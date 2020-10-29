import { HsMapService } from './../map/map.service';
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, OnInit} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {Layer} from 'ol/layer';
/**
 * @memberof hs.featureTable
 * @ngdoc component
 * @name HsFeatureTableComponent
 */
@Component({
  selector: 'hs-feature-table',
  template: require('./partials/feature-table.html'),
})
export class HsFeatureTableComponent implements OnInit {
  layers: Layer[] = [];
  constructor(
    private HsFeatureTableService: HsFeatureTableService,
    private HsConfig: HsConfig,
    private HsMapService: HsMapService
  ) {}
  ngOnInit(): void {
    this.HsMapService.loaded().then(() => {
      for (const layer of this.HsConfig.layersInFeatureTable || []) {
        this.addLayerToTable(layer);
      }
    });
  }
  addLayerToTable(layer: Layer): void {
    const layerDiscriptor = this.HsFeatureTableService.addLayer(layer);
    if (layerDiscriptor) {
      this.layers.push(layerDiscriptor);
    }
  }
}

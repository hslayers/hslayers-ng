import {Component, OnInit} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsFeatureTableService} from './feature-table.service';
import {HsMapService} from './../map/map.service';
import {Layer} from 'ol/layer';
/**
 * @memberof hs.featureTable
 * @ngdoc component
 * @name HsFeatureTableComponent
 */
@Component({
  selector: 'hs-feature-table',
  templateUrl: './partials/feature-table.html',
})
export class HsFeatureTableComponent implements OnInit {
  layers: Layer[] = [];
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
  addLayerToTable(layer: Layer): void {
    const layerDiscriptor = this.HsFeatureTableService.addLayer(layer);
    if (layerDiscriptor) {
      this.layers.push(layerDiscriptor);
    }
  }
}

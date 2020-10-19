import {Component, Input, OnInit} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsDatasourceLayerDescriptor} from './datasource-layer-descriptor.interface';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';

@Component({
  selector: 'hs-datasource-list-item',
  template: require('./partials/datasource-list-item.html'),
})
export class HsDatasourceListItemComponent implements OnInit {
  @Input() layer;
  @Input() endpoint;

  metadataModalVisible: boolean;
  selectedType: string; //do not rename to 'type', would clash in the template
  selectTypeToAddLayerVisible: boolean;
  whatToAddTypes;

  constructor(
    private hsConfig: HsConfig, //used in template
    private hsDatasourcesService: HsDatasourcesService
  ) {}

  /**
   * @function addLayerToMap
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @description Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   */
  async addLayerToMap(
    ds: HsEndpoint,
    layer: HsDatasourceLayerDescriptor
  ): Promise<void> {
    const availableTypes = await this.hsDatasourcesService.addLayerToMap(
      ds,
      layer,
      this.selectedType
    );
    if (Array.isArray(availableTypes)) {
      this.whatToAddTypes = availableTypes;
      this.selectTypeToAddLayerVisible = true;
    } else {
      this.selectTypeToAddLayerVisible = false;
      this.selectedType = null;
    }
    this.metadataModalVisible = false;
  }

  abortAdd(): void {
    this.selectTypeToAddLayerVisible = false;
    this.selectedType = null;
  }

  ngOnInit() {}
}

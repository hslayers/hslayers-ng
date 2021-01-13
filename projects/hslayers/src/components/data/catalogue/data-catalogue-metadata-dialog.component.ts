import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsConfig} from '../../../config.service';
import {HsDataCatalogueMapService} from './data-catalogue-map.service';
import {HsDataCatalogueService} from './data-catalogue.service';
import {HsDataLayerDescriptor} from './data-layer-descriptor.interface';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

@Component({
  selector: 'hs-data-metadata-dialog',
  templateUrl: './data-catalogue-metadata-dialog.html',
})
export class HsDataMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data;
  metadataModalVisible: boolean;
  selectedLayer;
  selectedLayerKeys;
  selectedDS;
  viewRef: ViewRef;

  constructor(
    public hsConfig: HsConfig, // used in template
    public HsDataCatalogueService: HsDataCatalogueService, //used in template
    public HsDataCatalogueMapService: HsDataCatalogueMapService, //used in template
    public hsDialogContainerService: HsDialogContainerService
  ) {}

  ngOnInit(): void {
    this.metadataModalVisible = true;
    this.selectedDS = this.data.selectedDS;
    this.selectedLayer = this.data.selectedLayer;
    this.selectedLayerKeys = Object.keys(this.selectedLayer);
    this.selectedLayerKeys = this.selectedLayerKeys.filter(e => e !== 'endpoint')
    console.log(this.selectedLayerKeys)
  }

  /**
   * @param ds Datasource (i.e. endpoint)
   * @param layer Description of a layer to be added
   * @param type Type in which the layer shall be added (WMS, WFS, etc.)
   */
  addLayerToMap(
    ds: HsEndpoint,
    layer: HsDataLayerDescriptor,
    type: string
  ): void {
    this.HsDataCatalogueService.addLayerToMap(ds, layer, type);
    this.close();
  }

  close(): void {
    this.metadataModalVisible = false;
    this.hsDialogContainerService.destroy(this);
  }
}

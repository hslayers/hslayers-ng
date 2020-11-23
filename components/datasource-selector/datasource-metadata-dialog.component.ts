import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsDatasourceLayerDescriptor} from './datasource-layer-descriptor.interface';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';

@Component({
  selector: 'hs-datasource-metadata-dialog',
  template: require('./partials/datasource-metadata-dialog.html'),
})
export class HsDatasourcesMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data;
  metadataModalVisible: boolean;
  selectedLayer;
  selectedLayerKeys;
  selectedDS;
  viewRef: ViewRef;

  constructor(
    public hsConfig: HsConfig, // used in template
    public hsDatasourcesService: HsDatasourcesService, //used in template
    public hsDatasourcesMapService: HsDatasourcesMapService, //used in template
    public hsDialogContainerService: HsDialogContainerService
  ) {}

  ngOnInit(): void {
    this.metadataModalVisible = true;
    this.selectedDS = this.data.selectedDS;
    this.selectedLayer = this.data.selectedLayer;
    this.selectedLayerKeys = Object.keys(this.selectedLayer);
  }

  /**
   * @param ds Datasource (i.e. endpoint)
   * @param layer Description of a layer to be added
   * @param type Type in which the layer shall be added (WMS, WFS, etc.)
   */
  addLayerToMap(
    ds: HsEndpoint,
    layer: HsDatasourceLayerDescriptor,
    type: string
  ): void {
    this.hsDatasourcesService.addLayerToMap(ds, layer, type);
    this.close();
  }

  close(): void {
    this.metadataModalVisible = false;
    this.hsDialogContainerService.destroy(this);
  }
}

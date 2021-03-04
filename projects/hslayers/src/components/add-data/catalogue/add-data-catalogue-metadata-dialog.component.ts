import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsAddDataCatalogueMapService} from './add-data-catalogue-map.service';
import {HsAddDataCatalogueService} from './add-data-catalogue.service';
import {HsAddDataLayerDescriptor} from './add-data-layer-descriptor.interface';
import {HsConfig} from '../../../config.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';

@Component({
  selector: 'hs-add-data-metadata-dialog',
  templateUrl: './add-data-catalogue-metadata-dialog.html',
})
export class HsAddDataMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data;

  selectedLayer;
  selectedLayerKeys;
  selectedDS;
  viewRef: ViewRef;

  constructor(
    public hsConfig: HsConfig, // used in template
    public HsAddDataCatalogueService: HsAddDataCatalogueService, //used in template
    public HsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //used in template
    public hsDialogContainerService: HsDialogContainerService
  ) {}

  ngOnInit(): void {
    this.selectedDS = this.data.selectedDS;
    this.selectedLayer = this.data.selectedLayer;
    this.selectedLayerKeys = Object.keys(this.selectedLayer);
    this.selectedLayerKeys = this.selectedLayerKeys.filter(
      (e) => e !== 'endpoint'
    );
  }

  /**
   * @param ds Datasource (i.e. endpoint)
   * @param layer Description of a layer to be added
   * @param type Type in which the layer shall be added (WMS, WFS, etc.)
   */
  addLayerToMap(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
    type: string
  ): void {
    this.HsAddDataCatalogueService.addLayerToMap(ds, layer, type);
    this.close();
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}

import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsAddDataCatalogueMapService} from '../catalogue-map.service';
import {HsAddDataCatalogueService} from '../catalogue.service';
import {HsAddDataLayerDescriptor} from '../layer-descriptor.model';
import {HsConfig} from '../../../../config.service';
import {HsDialogComponent} from '../../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';

@Component({
  selector: 'hs-catalogue-metadata',
  templateUrl: './catalogue-metadata.component.html',
})
export class HsCatalogueMetadataComponent implements HsDialogComponent, OnInit {
  @Input() data: {
    selectedLayer: HsAddDataLayerDescriptor;
    selectedDS: HsEndpoint;
  };

  selectedLayer: HsAddDataLayerDescriptor;
  selectedLayerKeys: string[];
  selectedDS: HsEndpoint;
  viewRef: ViewRef;

  constructor(
    public hsConfig: HsConfig, // used in template
    public hsAddDataCatalogueService: HsAddDataCatalogueService, //used in template
    public hsAddDataCatalogueMapService: HsAddDataCatalogueMapService, //used in template
    public hsDialogContainerService: HsDialogContainerService,
  ) {}

  ngOnInit(): void {
    this.selectedDS = this.data.selectedDS;
    this.selectedLayer = this.data.selectedLayer;
    this.selectedLayerKeys = Object.keys(this.selectedLayer);
    this.selectedLayerKeys = this.selectedLayerKeys.filter(
      (e) => e !== 'endpoint',
    );
  }

  /**
   * @param ds - Datasource (i.e. endpoint)
   * @param layer - Description of a layer to be added
   * @param type - Type in which the layer shall be added (WMS, WFS, etc.)
   */
  addLayerToMap(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
    type: string,
  ): void {
    this.hsAddDataCatalogueService.addLayerToMap(ds, layer, type);
    this.close();
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}

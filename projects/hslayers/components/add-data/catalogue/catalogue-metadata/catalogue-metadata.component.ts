import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsAddDataCatalogueMapService} from '../catalogue-map.service';
import {HsAddDataCatalogueService} from '../catalogue.service';
import {HsAddDataLayerDescriptor} from 'hslayers-ng/common/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEndpoint} from 'hslayers-ng/shared/endpoints';

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

    //Micka
    if (this.selectedDS.type === 'micka') {
      const availableTypes = this.selectedLayer.links
        .map((l) => {
          return ['WMS', 'WFS'].some((t) => l.protocol.includes(t))
            ? l.protocol.includes('WMS')
              ? 'WMS'
              : 'WFS'
            : null;
        })
        .filter((type) => !!type);
      this.fillAvailableTypes(availableTypes);

      this.selectedLayer.availableTypes = availableTypes;
      this.selectedLayer.metadata = {};
      this.selectedLayer.metadata.record_url = `${this.selectedDS.url.replace(
        'csw',
        'record/basic',
      )}/${this.selectedLayer.id}`;
    }
    //Layman
    else {
      this.fillAvailableTypes(this.selectedLayer.type);
      this.selectedLayer.availableTypes = this.selectedLayer.type;
      this.selectedLayer.bbox = this.selectedLayer['native_bounding_box'];
    }

    this.selectedLayerKeys = Object.keys(this.selectedLayer);
    this.selectedLayerKeys = this.selectedLayerKeys.filter(
      (e) => e !== 'endpoint',
    );
  }

  /**
   * Add WMTS (Tiled WMS) option in case WMS is available
   */
  private fillAvailableTypes(types: string[]) {
    if (types.includes('WMS')) {
      types.splice(1, 0, 'WMTS');
    }
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
    type = type === 'WMS' || type === 'WMTS' ? 'WMS' : type;
    this.hsAddDataCatalogueService.addLayerToMap(
      ds,
      {
        ...layer,
        useTiles: type === 'WMTS',
      },
      type,
    );
    this.close();
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}

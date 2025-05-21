import {inject, Injectable} from '@angular/core';

import {LayerOptions, WhatToAddDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';

import {HsAddDataService} from '../add-data.service';
import {HsUrlWmsService} from './wms.service';
import {HsCommonLaymanLayerService} from 'hslayers-ng/common/layman';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWmsLaymanService {
  hsAddService = inject(HsAddDataService);
  wmsService = inject(HsUrlWmsService);
  mapService = inject(HsMapService);
  hsCommonLaymanLayerService = inject(HsCommonLaymanLayerService);

  /**
   * Creates a WMS layer from a layman layer descriptor
   * NOTE: If catalogueService.addLayerToMap is further simplified whatToAdd could be simplified to simple workspace and layer name strings
   * currently for the sake of simplicity we have duplicate source of necessary inputs in whatToAdd and desc.
   */
  async getLayer(whatToAdd: WhatToAddDescriptor, options: LayerOptions) {
    const desc = await this.hsCommonLaymanLayerService.describeLayer(
      whatToAdd.name,
      whatToAdd.workspace,
      {useCache: true},
    );

    this.wmsService.data.srs = this.mapService
      .getMap()
      .getView()
      .getProjection()
      .getCode();
    this.wmsService.data.query_format = 'application/json';
    this.wmsService.data.get_map_url = whatToAdd.link;
    this.wmsService.data.tile_size = 256;
    this.wmsService.data.useTiles = options.useTiles;
    this.wmsService.data.version = '1.3.0';
    this.wmsService.data.visible = true;
    this.wmsService.data.base = false;

    const layer = this.wmsService.getLayer(
      {
        //l_<uuid>
        Name: desc.wms.name,
        title: desc.title,
        link: desc.wms.url,
        //TODO:
        MetadataURL: undefined,
        BoundingBox: [
          {
            crs: 'EPSG:3857',
            extent: desc.bounding_box,
          },
        ],
      },
      {
        ...options,
        layerName: desc.title.replace(/\//g, '&#47;'),
        // path: 'WMS',
        imageFormat: 'image/png',
        queryFormat: 'application/json',
        tileSize: 256,
        crs: this.mapService.getMap().getView().getProjection().getCode(),
        subLayers: '',
        queryable: true,
      },
    );
    return [layer];
  }
}

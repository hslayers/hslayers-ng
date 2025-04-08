import {inject, Injectable} from '@angular/core';

import {LayerOptions, WhatToAddDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {setQueryCapabilities} from 'hslayers-ng/common/extensions';

import {HsAddDataService} from '../add-data.service';
import {HsUrlWmsService} from './wms.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWmsLaymanService {
  hsAddService = inject(HsAddDataService);
  wmsService = inject(HsUrlWmsService);
  mapService = inject(HsMapService);

  /**
   * Creates a WMS layer from a layman layer descriptor
   */
  getLayer(whatToAdd: WhatToAddDescriptor, options: LayerOptions) {
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
        //l_<uuid> stored in layer prop instead of layer name
        Name: whatToAdd.layer,
        title: whatToAdd.title,
        link: whatToAdd.link,
        //TODO:
        MetadataURL: undefined,
        BoundingBox: [
          {
            crs: 'EPSG:3857',
            extent: whatToAdd.extent,
          },
        ],
      },
      {
        ...options,
        layerName: whatToAdd.title.replace(/\//g, '&#47;'),
        // path: 'WMS',
        imageFormat: 'image/png',
        queryFormat: 'application/json',
        tileSize: 256,
        crs: this.mapService.getMap().getView().getProjection().getCode(),
        subLayers: '',
        queryable: true,
      },
    );
    setQueryCapabilities(layer, false);
    return [layer];
  }
}

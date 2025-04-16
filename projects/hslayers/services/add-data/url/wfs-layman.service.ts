import {inject, Injectable} from '@angular/core';

import {LayerOptions, WhatToAddDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsWfsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';
import {setQueryCapabilities} from 'hslayers-ng/common/extensions';

import {HsUrlWfsService} from './wfs.service';
import {HsCommonLaymanLayerService} from 'hslayers-ng/common/layman';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWfsLaymanService {
  wfsService = inject(HsUrlWfsService);
  mapService = inject(HsMapService);
  hsWfsGetCapabilitiesService = inject(HsWfsGetCapabilitiesService);
  hsCommonLaymanLayerService = inject(HsCommonLaymanLayerService);
  /**
   * Creates a WMS layer from a layman layer descriptor
   */
  async getLayer(whatToAdd: WhatToAddDescriptor, options: LayerOptions) {
    const desc = await this.hsCommonLaymanLayerService.describeLayer(
      whatToAdd.name,
      whatToAdd.workspace,
      {useCache: true},
    );

    const srs = this.mapService.getMap().getView().getProjection().getCode();
    this.wfsService.data.srs = srs;

    this.hsWfsGetCapabilitiesService.service_url.set(desc.wfs.url);
    this.wfsService.data.version = '2.0.0';
    this.wfsService.data.output_format = 'GML3';
    this.wfsService.data.visible = true;
    this.wfsService.data.base = false;
    this.wfsService.data.group = false;

    const layer = this.wfsService.getLayer(
      {
        //l_<uuid> stored in layer prop instead of layer name
        Name: desc.wfs.name,
        Title: desc.title,
        _attributes: {
          namespace: 'http://layman',
        },
      },
      {
        ...options,
        layerName: desc.wfs.name.includes('layman')
          ? desc.wfs.name
          : `layman:${desc.wfs.name}`,
        crs: srs,
        queryable: true,
      },
    );
    setQueryCapabilities(layer, false);
    return [layer];
  }
}

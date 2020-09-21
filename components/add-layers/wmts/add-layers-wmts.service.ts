import {Injectable} from '@angular/core';

import {HsMapService} from '../../map/map.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/wmts/get-capabilities.service';

import {Group} from 'ol/layer';

@Injectable({providedIn: 'root'})
export class HsAddLayersWmtsService {
  constructor(
    private HsMapService: HsMapService,
    private HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService
  ) {}

  /**
   * @description Add service and its layers to project
   * @function addService
   * @param {string} url Service url
   * @param {Group} box Openlayers layer group to add the layer to
   */
  addService(url: string, box: Group): void {
    this.HsWmtsGetCapabilitiesService.requestGetCapabilities(url, (resp) => {
      const ol_layers = this.HsWmtsGetCapabilitiesService.service2layers(resp);
      ol_layers.forEach((layer) => {
        if (box !== undefined) {
          box.get('layers').push(layer);
        }
        this.HsMapService.addLayer(layer, true);
      });
    });
  }
}

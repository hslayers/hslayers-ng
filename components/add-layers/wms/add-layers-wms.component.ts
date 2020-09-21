import * as angular from 'angular';

import {Component} from '@angular/core';
import {HsAddLayersWmsService} from './add-layers-wms.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsWmsGetCapabilitiesService} from '../../../common/wms/get-capabilities.service';

@Component({
  selector: 'hs-add-layers-wms',
  template: require('./add-wms-layer.directive.html'),
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddLayersWmsComponent {
  data;
  hasNestedLayers;
  getDimensionValues;
  sourceHistory;
  showDetails: boolean;
  url: string;

  constructor(
    private hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private hsAddLayersWmsService: HsAddLayersWmsService,
    private hsEventBusService: HsEventBusService,
    private hsHistoryListService: HsHistoryListService
  ) {
    this.data = hsAddLayersWmsService.data;
    //FIXME: is it even fired?
    this.hsEventBusService.wmsConnecting.subscribe(({uri, layer}) => {
      this.setUrlAndConnect(uri, layer);
    });
    //this.sourceHistory = hsAddLayersWmsService.sourceHistory;
    this.getDimensionValues = hsAddLayersWmsService.getDimensionValues;
    this.hasNestedLayers = hsAddLayersWmsService.hasNestedLayers;
  }

  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.url = '';
    this.showDetails = false;
  }

  connect(layerToSelect): void {
    this.hsHistoryListService.addSourceHistory('Wms', this.url);
    this.hsWmsGetCapabilitiesService
      .requestGetCapabilities(this.url)
      .then((capabilities) => {
        this.hsAddLayersWmsService.capabilitiesReceived(
          capabilities,
          layerToSelect
        );
      });
    this.showDetails = true;
  }

  /**
   * @function selectAllLayers
   * @description Select all layers from service.
   */
  selectAllLayers(): void {
    /**
     * @param layer
     */
    function recurse(layer) {
      layer.checked = true;

      angular.forEach(layer.Layer, (sublayer) => {
        recurse(sublayer);
      });
    }
    angular.forEach(this.data.services.Layer, (layer) => {
      recurse(layer);
    });
  }

  addLayers(checked): void {
    this.hsAddLayersWmsService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddLayersWmsService.srsChanged();
  }

  /**
   * @description Connect to service of specified Url
   * @function setUrlAndConnect
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer): void {
    this.url = url;
    this.connect(layer);
  }
}

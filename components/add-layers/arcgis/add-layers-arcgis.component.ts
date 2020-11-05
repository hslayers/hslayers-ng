import * as angular from 'angular';
import {Component} from '@angular/core';

import {HsAddLayersArcGisService} from './add-layers-arcgis.service';
import {HsArcgisGetCapabilitiesService} from '../../../common/arcgis/get-capabilities.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-layers-arcgis',
  template: require('./add-arcgis-layer.directive.html'),
  //TODO: require('./add-arcgis-layer.md.directive.html')
})
export class HsAddLayersArcGisComponent {
  data;
  showDetails;
  sourceHistory;
  url;

  constructor(
    private hsAddLayersArcgisService: HsAddLayersArcGisService,
    private hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    private hsEventBusService: HsEventBusService,
    private hsHistoryListService: HsHistoryListService
  ) {
    this.data = hsAddLayersArcgisService.data;
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type === 'arcgis') {
        this.setUrlAndConnect(uri, layer);
      }
    });
    //TODO: this.sourceHistory = this.hsAddLayersArcgisService.sourceHistory;
  }

  hasNestedLayers = this.hsAddLayersArcgisService.hasNestedLayers;
  getDimensionValues = this.hsAddLayersArcgisService.getDimensionValues;

  /**
   * @function clear
   * @description Clear Url and hide detailsArcgis
   */
  clear(): void {
    this.url = '';
    this.showDetails = false;
  }

  connect = (layerToSelect): void => {
    this.hsHistoryListService.addSourceHistory('Arcgis', this.url);
    this.hsArcgisGetCapabilitiesService
      .requestGetCapabilities(this.url)
      .then((capabilities) => {
        this.hsAddLayersArcgisService.data.getMapUrl = this.url;
        setTimeout((_) => {
          this.hsAddLayersArcgisService.capabilitiesReceived(
            capabilities,
            layerToSelect
          );
        }, 0);
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
    this.hsAddLayersArcgisService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddLayersArcgisService.srsChanged();
  }

  /**
   * @function setUrlAndConnect
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer): void {
    this.url = url;
    this.connect(layer);
  }
}

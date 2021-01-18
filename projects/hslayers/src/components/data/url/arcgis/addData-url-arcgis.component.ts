import {Component} from '@angular/core';

import {HsArcgisGetCapabilitiesService} from '../../../../common/arcgis/get-capabilities.service';
import {HsAddDataArcGisService} from './addData-url-arcgis.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './addData-url-arcgis.directive.html',
  //TODO: require('./add-arcgis-layer.md.directive.html')
})
export class HsAddDataArcGisComponent {
  data;
  showDetails;
  sourceHistory;
  url;

  constructor(
    public HsAddDataArcGisService: HsAddDataArcGisService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.data = HsAddDataArcGisService.data;
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type === 'arcgis') {
        this.setUrlAndConnect(uri, layer);
      }
    });
    //TODO: this.sourceHistory = this.HsAddDataArcGisService.sourceHistory;
  }

  hasNestedLayers = this.HsAddDataArcGisService.hasNestedLayers;
  getDimensionValues = this.HsAddDataArcGisService.getDimensionValues;

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
        this.HsAddDataArcGisService.data.getMapUrl = this.url;
        setTimeout((_) => {
          this.HsAddDataArcGisService.capabilitiesReceived(
            capabilities,
            layerToSelect
          );
        }, 0);
      });
    this.showDetails = true;
  };

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
      if (layer.Layer) {
        for (const sublayer of layer.Layer) {
          recurse(sublayer);
        }
      }
    }
    for (const layer of this.data.services.Layer) {
      recurse(layer);
    }
  }

  addLayers(checked): void {
    this.HsAddDataArcGisService.addLayers(checked);
  }

  srsChanged(): void {
    this.HsAddDataArcGisService.srsChanged();
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

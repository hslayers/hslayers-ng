import {Component} from '@angular/core';

import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/arcgis/get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './add-data-url-arcgis.directive.html',
})
export class HsAddDataArcGisComponent {
  data;
  sourceHistory;
  layerToSelect: any;
  error: any;

  owsConnectingSubscription: Subscription;

  constructor(
    public HsAddDataArcGisService: HsAddDataArcGisService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.data = HsAddDataArcGisService.data;

    this.owsConnectingSubscription = this.hsEventBusService.owsConnecting.subscribe(
      ({type, uri, layer}) => {
        if (type === 'arcgis') {
          this.setUrlAndConnect(uri, layer);
        }
      }
    );

    //TODO: this.sourceHistory = this.HsAddDataArcGisService.sourceHistory;
  }

  hasNestedLayers = this.HsAddDataArcGisService.hasNestedLayers;
  getDimensionValues = this.HsAddDataArcGisService.getDimensionValues;

  ngOnDestroy() {
    this.owsConnectingSubscription.unsubscribe();
  }

  connect = (layerToSelect): void => {
    this.hsHistoryListService.addSourceHistory(
      'Arcgis',
      this.HsAddDataArcGisService.url
    );
    this.hsArcgisGetCapabilitiesService.requestGetCapabilities(
      this.HsAddDataArcGisService.url
    );
    this.HsAddDataArcGisService.data.getMapUrl = this.HsAddDataArcGisService.url;

    this.HsAddDataArcGisService.showDetails = true;
  };

  /**
   * @function selectAllLayers
   * @description Select all layers from service.
   */
  selectAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
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
    this.HsAddDataArcGisService.url = url;
    this.connect(layer);
  }
}

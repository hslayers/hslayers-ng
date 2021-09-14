import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsAddDataUrlTabInterface} from '../add-data-url-tab.interface';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './add-data-url-arcgis.component.html',
})
export class HsAddDataArcGisComponent
  implements HsAddDataUrlTabInterface, OnDestroy {
  owsConnectingSubscription: Subscription;
  constructor(
    public hsAddDataArcGisService: HsAddDataArcGisService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type === 'arcgis') {
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    const url = this.hsAddDataArcGisService.url;
    if (!url || url === '') {
      return;
    }
    this.hsHistoryListService.addSourceHistory('Arcgis', url);
    Object.assign(this.hsAddDataArcGisService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    this.hsAddDataArcGisService.data.getMapUrl = url;
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(url);
    this.hsAddDataArcGisService.addLayerFromCapabilities(wrapper);
  }

  /**
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer: string): void {
    this.updateUrl(url);
    this.connect(layer);
  }

  /**
   * @description For the sake of possible future implementation changes
   * @param {string} url URL to be set
   */
  updateUrl(url: string): void {
    this.hsAddDataArcGisService.url = url;
  }
}

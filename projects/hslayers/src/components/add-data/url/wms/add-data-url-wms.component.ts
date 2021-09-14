import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataUrlTabInterface} from '../add-data-url-tab.interface';
import {HsAddDataUrlWmsService} from './add-data-url-wms.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wms',
  templateUrl: './add-data-url-wms.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmsComponent
  implements HsAddDataUrlTabInterface, OnDestroy {
  owsConnectingSubscription: Subscription;
  constructor(
    public hsAddDataUrlWmsService: HsAddDataUrlWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService
  ) {
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wms') {
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    const url = this.hsAddDataUrlWmsService.url;
    if (!url || url === '') {
      return;
    }
    this.hsHistoryListService.addSourceHistory('wms', url);
    Object.assign(this.hsAddDataUrlWmsService, {
      layerToSelect,
      loadingInfo: true,
    });
    const wrapper = await this.hsWmsGetCapabilitiesService.request(url);
    this.hsAddDataUrlWmsService.addLayerFromCapabilities(wrapper);
  }
  /**
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   * @param {string} [layer] Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer?: string): void {
    this.updateUrl(url);
    this.connect(layer);
  }

  /**
   * @description For the sake of possible future implementation changes
   * @param {string} url URL to be set
   */
  updateUrl(url: string): void {
    this.hsAddDataUrlWmsService.url = url;
  }
}

import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlComponentInterface} from '../add-data-url-type-component.interface';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataWfsService} from './add-data-url-wfs.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wfs',
  templateUrl: './add-data-wfs-layer.component.html',
})
export class HsAddDataWfsComponent
  implements HsAddDataUrlComponentInterface, OnDestroy {
  owsConnectingSubscription: Subscription;
  hasChecked: boolean;
  loadingFeatures: boolean;
  title = ''; //FIXME: unused
  data: any;
  constructor(
    public hsAddDataWfsService: HsAddDataWfsService,
    public hsEventBusService: HsEventBusService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService, //used in template,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.data = this.hsAddDataWfsService.data;
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(
        ({type, uri, layer, sld}) => {
          if (type == 'wfs') {
            this.hsAddDataWfsService.layerToSelect = layer;
            this.setUrlAndConnect(uri, sld);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }
  //NOT BEING USED
  /**
   * Clear URL and hide detailsWms
   */
  clear(): void {
    this.hsAddDataWfsService.url = '';
    this.hsAddDataWfsService.showDetails = false;
  }

  async connect(sld?: string): Promise<void> {
    const url = this.hsAddDataWfsService.url;
    if (!url || url === '') {
      return;
    }
    this.hasChecked = false;
    this.hsHistoryListService.addSourceHistory('wfs', url);
    Object.assign(this.hsAddDataWfsService, {
      services: [],
      showDetails: true,
      loadingInfo: true,
    });
    const wrapper = await this.hsWfsGetCapabilitiesService.request(url);
    this.hsAddDataWfsService.addLayerFromCapabilities(wrapper, sld);
  }

  /**
   * Connect to service of specified Url
   * @param url - URL of requested service
   */
  setUrlAndConnect(url: string, sld: string): void {
    this.updateUrl(url);
    this.connect(sld);
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(
      this.data.services
    );
  }

  /**
   * @description For the sake of possible future implementation changes
   * @param {string} url URL to be set
   */
  updateUrl(url: string): void {
    this.hsAddDataWfsService.url = url;
  }
}

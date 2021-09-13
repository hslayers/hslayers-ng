import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataUrlTabInterface} from '../add-data-url-tab.interface';
import {HsAddDataWfsService} from './add-data-url-wfs.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wfs',
  templateUrl: './add-data-wfs-layer.component.html',
})
export class HsAddDataWfsComponent
  implements HsAddDataUrlTabInterface, OnDestroy {
  owsConnectingSubscription: Subscription;
  hasChecked: boolean;
  loadingFeatures: boolean;
  title = ''; //FIXME: unused

  constructor(
    public hsAddDataWfsService: HsAddDataWfsService,
    public hsEventBusService: HsEventBusService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService, //used in template,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(
        ({type, uri, layer, sld}) => {
          if (type == 'wfs') {
            this.hsAddDataWfsService.layerToAdd = layer;
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
    if (!url) {
      return;
    }
    this.hasChecked = false;
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
      this.hsAddDataWfsService.services
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

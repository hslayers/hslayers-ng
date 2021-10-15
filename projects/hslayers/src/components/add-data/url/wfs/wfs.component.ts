import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlComponentModel} from '../models/url-type-component.model';
import {HsUrlWfsService} from './wfs.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';
import {urlDataObject} from '../types/data-object.type';

@Component({
  selector: 'hs-url-wfs',
  templateUrl: './wfs.component.html',
})
export class HsUrlWfsComponent implements HsUrlComponentModel, OnDestroy {
  data: urlDataObject;
  loadingFeatures: boolean;
  owsConnectingSubscription: Subscription;
  title = ''; //FIXME: unused
  constructor(
    public hsUrlWfsService: HsUrlWfsService,
    public hsEventBusService: HsEventBusService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService, //used in template,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.data = this.hsUrlWfsService.data;
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(
        ({type, uri, layer, sld}) => {
          if (type == 'wfs') {
            this.hsAddDataCommonService.layerToSelect = layer;
            this.setUrlAndConnect(uri, sld);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(sld?: string): Promise<void> {
    const url = this.hsAddDataCommonService.url;
    if (!url || url === '') {
      return;
    }
    this.hsAddDataUrlService.hasAnyChecked = false;
    this.hsHistoryListService.addSourceHistory('wfs', url);
    Object.assign(this.hsAddDataCommonService, {
      services: [],
      showDetails: true,
      loadingInfo: true,
    });
    const wrapper = await this.hsWfsGetCapabilitiesService.request(url);
    this.hsUrlWfsService.addLayerFromCapabilities(wrapper, sld);
  }

  /**
   * Connect to service of specified Url
   * @param url - URL of requested service
   */
  setUrlAndConnect(url: string, sld: string): void {
    this.hsAddDataCommonService.updateUrl(url);
    this.connect(sld);
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.data.services);
  }
}

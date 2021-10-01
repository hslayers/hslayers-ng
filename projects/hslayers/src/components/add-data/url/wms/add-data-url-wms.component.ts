import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataCommonService} from '../../common/add-data-common.service';
import {HsAddDataUrlComponentModel} from '../models/add-data-url-type-component.model';
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
  implements HsAddDataUrlComponentModel, OnDestroy {
  owsConnectingSubscription: Subscription;
  constructor(
    public hsAddDataUrlWmsService: HsAddDataUrlWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wms') {
          this.hsAddDataCommonService.layerToSelect = layer;
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    const url = this.hsAddDataCommonService.url;
    if (!url || url === '') {
      return;
    }
    this.hsHistoryListService.addSourceHistory('wms', url);
    Object.assign(this.hsAddDataCommonService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    const wrapper = await this.hsWmsGetCapabilitiesService.request(url);
    this.hsAddDataUrlWmsService.addLayerFromCapabilities(wrapper);
  }
  /**
   * Connect to service of specified Url
   * @param url - Url of requested service
   * @param layer - Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer?: string): void {
    this.hsAddDataCommonService.updateUrl(url);
    this.connect(layer);
  }
}

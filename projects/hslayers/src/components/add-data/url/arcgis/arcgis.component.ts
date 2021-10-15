import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlArcGisService} from './arcgis.service';
import {HsUrlComponentModel} from '../models/url-type-component.model';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
})
export class HsUrlArcGisComponent implements HsUrlComponentModel, OnDestroy {
  owsConnectingSubscription: Subscription;
  constructor(
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService
  ) {
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type === 'arcgis') {
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
    this.hsHistoryListService.addSourceHistory('arcgis', url);
    Object.assign(this.hsAddDataCommonService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    this.hsUrlArcGisService.data.get_map_url = url;
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(url);
    this.hsUrlArcGisService.addLayerFromCapabilities(wrapper);
  }

  /**
   * Connect to service of specified Url
   * @param url - Url of requested service
   * @param layer - Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer: string): void {
    this.hsAddDataCommonService.updateUrl(url);
    this.connect(layer);
  }
}

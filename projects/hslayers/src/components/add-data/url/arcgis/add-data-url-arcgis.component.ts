import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsAddDataCommonUrlService} from '../../public-api';
import {HsAddDataUrlComponentModel} from '../models/add-data-url-type-component.model';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './add-data-url-arcgis.component.html',
})
export class HsAddDataArcGisComponent
  implements HsAddDataUrlComponentModel, OnDestroy {
  owsConnectingSubscription: Subscription;
  constructor(
    public hsAddDataArcGisService: HsAddDataArcGisService,
    public hsAddDataCommonUrlService: HsAddDataCommonUrlService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService
  ) {
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type === 'arcgis') {
          this.hsAddDataCommonUrlService.layerToSelect = layer;
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    const url = this.hsAddDataCommonUrlService.url;
    if (!url || url === '') {
      return;
    }
    this.hsHistoryListService.addSourceHistory('arcgis', url);
    Object.assign(this.hsAddDataCommonUrlService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    this.hsAddDataArcGisService.data.get_map_url = url;
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(url);
    this.hsAddDataArcGisService.addLayerFromCapabilities(wrapper);
  }

  /**
   * Connect to service of specified Url
   * @param url - Url of requested service
   * @param layer - Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer: string): void {
    this.hsAddDataCommonUrlService.updateUrl(url);
    this.connect(layer);
  }
}

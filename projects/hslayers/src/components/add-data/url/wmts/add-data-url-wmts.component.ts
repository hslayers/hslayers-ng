import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlComponentModel} from '../models/add-data-url-type-component.model';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataUrlWmtsService} from './add-data-url-wmts-service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/get-capabilities/wmts-get-capabilities.service';
import {addDataUrlDataObject} from '../types/add-data-url-data-object.type';

@Component({
  selector: 'hs-add-data-url-wmts',
  templateUrl: './add-data-url-wmts.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmtsComponent
  implements HsAddDataUrlComponentModel, OnDestroy {
  data: addDataUrlDataObject;
  owsConnectingSubscription: Subscription;
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsLogService: HsLogService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLanguageService: HsLanguageService,
    public hsAddDataUrlWmtsService: HsAddDataUrlWmtsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.data = this.hsAddDataUrlWmtsService.data;
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wmts') {
          this.hsAddDataUrlWmtsService.layerToSelect = layer;
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    const url = this.hsAddDataUrlWmtsService.url;
    if (!url || url === '') {
      return;
    }
    this.hsAddDataUrlService.hasAllChecked = false;
    this.hsHistoryListService.addSourceHistory('wmts', url);
    Object.assign(this.hsAddDataUrlWmtsService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    const response = await this.hsWmtsGetCapabilitiesService.request(url);
    this.hsAddDataUrlWmtsService.addLayerFromCapabilities(response);
  }

  setUrlAndConnect(url: string, layer?: string): void {
    this.updateUrl(url);
    this.connect(layer);
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.data.services);
  }

  /**
   * For the sake of possible future implementation changes
   * @param url - URL to be set
   */
  updateUrl(url: string): void {
    this.hsAddDataUrlWmtsService.url = url;
  }
}

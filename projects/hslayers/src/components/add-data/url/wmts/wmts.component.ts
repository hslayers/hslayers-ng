import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUrlComponentModel} from '../models/url-type-component.model';
import {HsUrlWmtsService} from './wmts-service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/get-capabilities/wmts-get-capabilities.service';
import {urlDataObject} from '../types/data-object.type';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmtsComponent implements HsUrlComponentModel, OnDestroy {
  data: urlDataObject;
  owsConnectingSubscription: Subscription;
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsLogService: HsLogService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLanguageService: HsLanguageService,
    public hsUrlWmtsService: HsUrlWmtsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.data = this.hsUrlWmtsService.data;
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wmts') {
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
    this.hsAddDataUrlService.hasAnyChecked = false;
    this.hsHistoryListService.addSourceHistory('wmts', url);
    Object.assign(this.hsAddDataCommonService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    const response = await this.hsWmtsGetCapabilitiesService.request(url);
    this.hsUrlWmtsService.addLayerFromCapabilities(response);
  }

  setUrlAndConnect(url: string, layer?: string): void {
    this.hsAddDataCommonService.updateUrl(url);
    this.connect(layer);
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.data.services);
  }
}

import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlWmsService} from './add-data-url-wms.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wms',
  templateUrl: './add-data-url-wms.directive.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmsComponent implements OnDestroy {
  data;
  hasNestedLayers;
  getDimensionValues;
  sourceHistory;
  url: string;
  layerToSelect: any;
  owsConnectingSubscription: Subscription;
  checkedLayers = {};
  hasChecked = false;
  selectAll = true;
  constructor(
    public hsAddDataUrlWmsService: HsAddDataUrlWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsLog: HsLogService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsLanguageService: HsLanguageService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService
  ) {
    this.data = this.hsAddDataUrlWmsService.data;
    //FIXME: is it even fired?

    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wms') {
          this.setUrlAndConnect(uri, layer);
        }
      });

    this.getDimensionValues = hsAddDataUrlWmsService.getDimensionValues;
    this.hasNestedLayers = hsAddDataUrlWmsService.hasNestedLayers;
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.updateUrl('');
    this.hsAddDataUrlWmsService.showDetails = false;
  }

  searchForChecked(service): void {
    this.checkedLayers[service.Name] = service.checked;
    this.hasChecked = Object.values(this.checkedLayers).some(
      (value) => value === true
    );
  }

  connect = (layerToSelect: string): void => {
    try {
      this.hasChecked = false;
      this.checkedLayers = {};
      this.hsHistoryListService.addSourceHistory(
        'wms',
        this.hsAddDataUrlWmsService.url
      );
      this.hsAddDataUrlWmsService.layerToSelect = layerToSelect;
      this.hsWmsGetCapabilitiesService.requestGetCapabilities(
        this.hsAddDataUrlWmsService.url
      );
      this.hsAddDataUrlWmsService.loadingInfo = true;
    } catch (e) {
      this.hsAddDataUrlWmsService.getWmsCapabilitiesError.next(e);
    }
  };

  /**
   * Select all layers from service
   * @param layers
   */
  selectAllLayers(layers: any[]): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(layers);
  }
  checkAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = false;
      layer.checked = !this.selectAll;
      this.searchForChecked(layer);
      if (layer.Layer) {
        this.checkAllLayers(layer.Layer);
      }
    }
  }
  addLayers(checked: boolean): void {
    this.hsAddDataUrlWmsService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddDataUrlWmsService.srsChanged();
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
  private updateUrl(url: string): void {
    this.hsAddDataUrlWmsService.url = url;
  }
}

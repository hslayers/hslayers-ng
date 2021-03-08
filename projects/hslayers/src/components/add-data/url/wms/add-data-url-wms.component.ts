import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataUrlWmsService} from './add-data-url-wms.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/wms/get-capabilities.service';

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

  constructor(
    public HsAddDataUrlWmsService: HsAddDataUrlWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsLog: HsLogService,
    public HsDialogContainerService: HsDialogContainerService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public HsLanguageService: HsLanguageService
  ) {
    this.data = this.HsAddDataUrlWmsService.data;
    //FIXME: is it even fired?

    this.owsConnectingSubscription = this.hsEventBusService.owsConnecting.subscribe(
      ({type, uri, layer}) => {
        if (type == 'wms') {
          this.setUrlAndConnect(uri, layer);
        }
      }
    );

    this.getDimensionValues = HsAddDataUrlWmsService.getDimensionValues;
    this.hasNestedLayers = HsAddDataUrlWmsService.hasNestedLayers;
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.updateUrl('');
    this.HsAddDataUrlWmsService.showDetails = false;
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
        this.HsAddDataUrlWmsService.url
      );
      this.HsAddDataUrlWmsService.layerToSelect = layerToSelect;
      this.hsWmsGetCapabilitiesService.requestGetCapabilities(
        this.HsAddDataUrlWmsService.url
      );
    } catch (e) {
      this.HsAddDataUrlWmsService.getWmsCapabilitiesError.next(e);
    }
  };

  /**
   * @function selectAllLayers
   * @description Select all layers from service
   * @param layers
   */
  selectAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
    }
  }

  addLayers(checked: boolean): void {
    this.HsAddDataUrlWmsService.addLayers(checked);
  }

  srsChanged(): void {
    this.HsAddDataUrlWmsService.srsChanged();
  }

  /**
   * @description Connect to service of specified Url
   * @function setUrlAndConnect
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
    this.HsAddDataUrlWmsService.url = url;
  }
}

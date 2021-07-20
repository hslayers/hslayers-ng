import {Component, OnDestroy} from '@angular/core';

import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUtilsService} from '../../../utils/utils.service';

import {Subscription} from 'rxjs';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './add-data-url-arcgis.directive.html',
})
export class HsAddDataArcGisComponent implements OnDestroy {
  data;
  sourceHistory;
  layerToSelect: any;
  error: any;
  selectAll = true;
  owsConnectingSubscription: Subscription;
  hasChecked: boolean;

  constructor(
    public hsAddDataArcGisService: HsAddDataArcGisService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService
  ) {
    this.data = hsAddDataArcGisService.data;

    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type === 'arcgis') {
          this.setUrlAndConnect(uri, layer);
        }
      });

    //TODO: this.sourceHistory = this.HsAddDataArcGisService.sourceHistory;
  }

  hasNestedLayers = this.hsAddDataArcGisService.hasNestedLayers;
  getDimensionValues = this.hsAddDataArcGisService.getDimensionValues;

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  connect = (layerToSelect: string): void => {
    this.hasChecked = false;
    this.hsHistoryListService.addSourceHistory(
      'Arcgis',
      this.hsAddDataArcGisService.url
    );
    this.hsArcgisGetCapabilitiesService.requestGetCapabilities(
      this.hsAddDataArcGisService.url
    );
    this.hsAddDataArcGisService.data.getMapUrl =
      this.hsAddDataArcGisService.url;
    this.hsAddDataArcGisService.loadingInfo = true;
    this.hsAddDataArcGisService.showDetails = true;
  };

  /**
   * @param layers
   * @description Select all layers from service.
   */
  selectAllLayers(layers: any[]): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(layers);
  }

  checkAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = false;
      layer.checked = !this.selectAll;
      if (layer.Layer) {
        this.checkAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  addLayers(checked: boolean): void {
    this.hsAddDataArcGisService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddDataArcGisService.srsChanged();
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(
      this.data.services
    );
  }

  /**
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer: string): void {
    this.hsAddDataArcGisService.url = url;
    this.connect(layer);
  }
}

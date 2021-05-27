import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataWfsService} from './add-data-url-wfs.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/wfs/get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wfs',
  templateUrl: './add-data-wfs-layer.directive.html',
})
export class HsAddDataWfsComponent implements OnDestroy {
  owsConnectingSubscription: Subscription;
  selectAll = true;
  addAll: boolean;
  hasChecked: boolean;
  loadingFeatures: boolean;
  title = ''; //FIXME: unused

  constructor(
    public hsAddDataWfsService: HsAddDataWfsService,
    public hsEventBusService: HsEventBusService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService, //used in template,
    public hsAddDataUrlService: HsAddDataUrlService
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wfs') {
          this.hsAddDataWfsService.layerToAdd = layer;
          this.setUrlAndConnect(uri);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  /**
   * @function clear
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.hsAddDataWfsService.url = '';
    this.hsAddDataWfsService.showDetails = false;
  }

  connect = (): void => {
    this.hasChecked = false;
    this.hsWfsGetCapabilitiesService.requestGetCapabilities(
      this.hsAddDataWfsService.url
    );
    this.hsAddDataWfsService.services = [];
    this.hsAddDataWfsService.showDetails = true;
    this.hsAddDataWfsService.loadingInfo = true;
  };

  /**
   * @function setUrlAndConnect
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   */
  setUrlAndConnect(url: string): void {
    this.hsAddDataWfsService.url = url;
    this.connect();
  }

  /**
   * @function selectAllLayers
   * @description Select all layers from service.
   * @param layers
   */
  selectAllLayers(layers): void {
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
  /**
   * @function addLayers
   * @description First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param {boolean} checkedOnly Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): void {
    this.hsAddDataWfsService.addAll = checkedOnly;
    for (const layer of this.hsAddDataWfsService.services) {
      this.hsAddDataWfsService.addLayersRecursively(layer);
    }
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(
      this.hsAddDataWfsService.services
    );
  }
}

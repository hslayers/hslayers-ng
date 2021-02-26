import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

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

  addAll: boolean;
  isChecked: boolean;
  loadingFeatures: boolean;
  title = ''; //FIXME: unused

  constructor(
    public HsAddDataWfsService: HsAddDataWfsService,
    public HsEventBusService: HsEventBusService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public HsUtilsService: HsUtilsService //used in template
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription = this.HsEventBusService.owsConnecting.subscribe(
      ({type, uri, layer}) => {
        if (type == 'wfs') {
          this.HsAddDataWfsService.layerToAdd = layer;
          this.setUrlAndConnect(uri);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  /**
   * @function clear
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.HsAddDataWfsService.url = '';
    this.HsAddDataWfsService.showDetails = false;
  }

  connect = (): void => {
    this.HsWfsGetCapabilitiesService.requestGetCapabilities(
      this.HsAddDataWfsService.url
    );
    this.HsAddDataWfsService.services = [];
    this.HsAddDataWfsService.showDetails = true;
  };

  /**
   * @function setUrlAndConnect
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   */
  setUrlAndConnect(url: string): void {
    this.HsAddDataWfsService.url = url;
    this.connect();
  }

  /**
   * @function selectAllLayers
   * @description Select all layers from service.
   * @param layers
   */
  selectAllLayers(layers): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
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
    this.HsAddDataWfsService.addAll = checkedOnly;
    for (const layer of this.HsAddDataWfsService.services) {
      this.HsAddDataWfsService.addLayersRecursively(layer);
    }
  }

  checked(): boolean {
    for (const layer of this.HsAddDataWfsService.services) {
      if (layer.checked) {
        return true;
      }
    }
    return false;
  }

  changed(): void {
    this.isChecked = this.checked();
  }
}

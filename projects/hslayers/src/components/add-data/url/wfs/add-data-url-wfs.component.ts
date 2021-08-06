import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataWfsService} from './add-data-url-wfs.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';

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
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(
        ({type, uri, layer, sld}) => {
          if (type == 'wfs') {
            this.hsAddDataWfsService.layerToAdd = layer;
            this.setUrlAndConnect(uri, sld);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  /**
   * Clear URL and hide detailsWms
   */
  clear(): void {
    this.hsAddDataWfsService.url = '';
    this.hsAddDataWfsService.showDetails = false;
  }

  async connect(sld?: string): Promise<void> {
    this.hasChecked = false;
    Object.assign(this.hsAddDataWfsService, {
      services: [],
      showDetails: true,
      loadingInfo: true,
    });
    const wrapper = await this.hsWfsGetCapabilitiesService.request(
      this.hsAddDataWfsService.url
    );
    this.hsAddDataWfsService.addLayerFromCapabilities(wrapper, sld);
  }

  /**
   * Connect to service of specified Url
   * @param url - URL of requested service
   */
  setUrlAndConnect(url: string, sld: string): void {
    this.hsAddDataWfsService.url = url;
    this.connect(sld);
  }

  /**
   * Select all layers from service.
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
   * First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param checkedOnly - Add all available layers or only checked ones. Checked=false=all
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

import {Component, OnDestroy} from '@angular/core';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataUrlWmtsService} from './add-data-url-wmts-service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/get-capabilities/wmts-get-capabilities.service';

import {Subscription} from 'rxjs';

@Component({
  selector: 'hs-add-data-url-wmts',
  templateUrl: './add-data-url-wmts.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmtsComponent implements OnDestroy {
  owsConnectingSubscription: Subscription;
  hasChecked: boolean;

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
    public hsAddDataService: HsAddDataService
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription =
      this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
        if (type == 'wmts') {
          this.setUrlAndConnect(uri, layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  async connect(layerToSelect?: string): Promise<void> {
    this.hasChecked = false;
    Object.assign(this.hsAddDataUrlWmtsService, {
      layerToSelect,
      loadingInfo: true,
      showDetails: true,
    });
    const response = await this.hsWmtsGetCapabilitiesService.request(
      this.hsAddDataUrlWmtsService.url
    );
    this.hsAddDataUrlWmtsService.addLayerFromCapabilities(response);
  }

  selectAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(
      this.hsAddDataUrlWmtsService.services
    );
  }

  setUrlAndConnect(url: string, layer?: string): void {
    this.hsAddDataUrlWmtsService.url = url;
    this.connect(layer);
  }

  addLayers(checkedOnly: boolean): void {
    this.hsAddDataUrlWmtsService.addLayers(checkedOnly);
    //FIXME: to implement
    // this.zoomToLayers();
  }
}

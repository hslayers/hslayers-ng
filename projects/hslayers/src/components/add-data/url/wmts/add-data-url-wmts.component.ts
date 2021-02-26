import {Component, OnDestroy} from '@angular/core';

import {HsAddDataUrlWmtsService} from './add-data-url-wmts-service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/wmts/get-capabilities.service';

import {Subscription} from 'rxjs';

@Component({
  selector: 'hs-add-data-url-wmts',
  templateUrl: './add-data-url-wmts.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmtsComponent implements OnDestroy {
  owsConnectingSubscription: Subscription;
  isChecked: boolean;

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public HsEventBusService: HsEventBusService,
    public HsLogService: HsLogService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLanguageService: HsLanguageService,
    public HsAddDataUrlWmtsService: HsAddDataUrlWmtsService
  ) {
    //Merge subscriptions in order to easily unsubscribe on destroy
    this.owsConnectingSubscription = this.HsEventBusService.owsConnecting.subscribe(
      ({type, uri, layer}) => {
        if (type == 'wmts') {
          this.setUrlAndConnect(uri, layer);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.owsConnectingSubscription.unsubscribe();
  }

  connect = (layerToSelect): void => {
    this.HsAddDataUrlWmtsService.layerToSelect = layerToSelect;

    this.HsAddDataUrlWmtsService.layersLoading = true;
    this.HsWmtsGetCapabilitiesService.requestGetCapabilities(
      this.HsAddDataUrlWmtsService.url
    );
    this.HsAddDataUrlWmtsService.showDetails = true;
  };

  selectAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  private checked(): boolean {
    for (const layer of this.HsAddDataUrlWmtsService.services) {
      if (layer.checked) {
        return true;
      }
    }
    return false;
  }

  changed(): void {
    this.isChecked = this.checked();
  }

  setUrlAndConnect(url: string, layer?: string): void {
    this.HsAddDataUrlWmtsService.url = url;
    this.connect(layer);
  }

  addLayers(checkedOnly: boolean): void {
    this.HsAddDataUrlWmtsService.addLayers(checkedOnly);
    //FIXME: to implement
    // this.zoomToLayers();
  }
}

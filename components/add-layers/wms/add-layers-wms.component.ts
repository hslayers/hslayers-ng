import {Component} from '@angular/core';
import {HsAddLayersWmsService} from './add-layers-wms.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../common/capabilities-error-dialog.component';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsWmsGetCapabilitiesService} from '../../../common/wms/get-capabilities.service';

@Component({
  selector: 'hs-add-layers-wms',
  template: require('./add-wms-layer.directive.html'),
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddLayersWmsComponent {
  data;
  hasNestedLayers;
  getDimensionValues;
  sourceHistory;
  showDetails: boolean;
  url: string;
  layerToSelect: any;
  error: any;
  constructor(
    public hsAddLayersWmsService: HsAddLayersWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsLog: HsLogService,
    public HsDialogContainerService: HsDialogContainerService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService
  ) {
    this.data = this.hsAddLayersWmsService.data;
    this.url = '';
    //FIXME: is it even fired?
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wms') {
        this.setUrlAndConnect(uri, layer);
      }
    });

    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      async ({type, response}) => {
        if (type === 'WMS') {
          try {
            await this.hsAddLayersWmsService.capabilitiesReceived(
              response,
              this.layerToSelect
            );
            if (this.layerToSelect) {
              this.addLayers(true);
            }
          } catch (e) {
            if (e.status == 401) {
              this.hsAddLayersWmsService.getWmsCapabilitiesError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.hsAddLayersWmsService.getWmsCapabilitiesError.next(e);
          }
        }
      }
    );
    this.hsAddLayersWmsService.getWmsCapabilitiesError.subscribe((e) => {
      this.hsLog.warn(e);
      this.url = null;
      this.showDetails = false;

      this.error = e.toString();
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        this.error
      );
    });

    this.getDimensionValues = hsAddLayersWmsService.getDimensionValues;
    this.hasNestedLayers = hsAddLayersWmsService.hasNestedLayers;
  }

  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.updateUrl('');
    this.showDetails = false;
  }

  connect = (layerToSelect: string): void => {
    this.hsHistoryListService.addSourceHistory('wms', this.url);
    this.hsWmsGetCapabilitiesService.requestGetCapabilities(this.url);
    this.layerToSelect = layerToSelect;
    this.showDetails = true;
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
    this.hsAddLayersWmsService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddLayersWmsService.srsChanged();
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
    this.url = url;
  }
}

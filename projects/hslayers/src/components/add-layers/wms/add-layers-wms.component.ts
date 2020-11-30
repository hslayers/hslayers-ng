import {Component} from '@angular/core';
import {HsAddLayersWmsService} from './add-layers-wms.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsWmsGetCapabilitiesService} from '../../../common/wms/get-capabilities.service';

@Component({
  selector: 'hs-add-layers-wms',
  templateUrl: './add-wms-layer.directive.html',
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

  constructor(
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsAddLayersWmsService: HsAddLayersWmsService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService
  ) {
    this.data = hsAddLayersWmsService.data;
    //FIXME: is it even fired?
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'WMS') {
        this.setUrlAndConnect(uri, layer);
      }
    });

    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      ({type, response}) => {
        if (type === 'WMS') {
          try {
            this.hsAddLayersWmsService.capabilitiesReceived(
              response,
              this.layerToSelect
            );
          } catch (e) {
            console.log(e);
          }
        }
      }
    );
    //this.sourceHistory = hsAddLayersWmsService.sourceHistory;
    this.getDimensionValues = hsAddLayersWmsService.getDimensionValues;
    this.hasNestedLayers = hsAddLayersWmsService.hasNestedLayers;
  }

  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.url = '';
    this.showDetails = false;
  }

  connect = (layerToSelect): void => {
    this.hsHistoryListService.addSourceHistory('wms', this.url);
    this.hsWmsGetCapabilitiesService.requestGetCapabilities(this.url);
    this.layerToSelect = layerToSelect;
    this.showDetails = true;
  };

  /**
   * @param layers
   * @function selectAllLayers
   * @description Select all layers from service.
   */
  selectAllLayers(layers) {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
    }
  }

  addLayers(checked): void {
    this.hsAddLayersWmsService.addLayers(checked);
  }

  srsChanged(): void {
    this.hsAddLayersWmsService.srsChanged();
  }

  /**
   * @description Connect to service of specified Url
   * @function setUrlAndConnect
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer): void {
    this.url = url;
    this.connect(layer);
  }
}

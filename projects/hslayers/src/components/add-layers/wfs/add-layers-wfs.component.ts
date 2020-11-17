import VectorLayer from 'ol/layer/Vector';
import {Component} from '@angular/core';
import {bbox} from 'ol/loadingstrategy';

import {HsAddLayersWfsService} from './add-layers-wfs-service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsWfsGetCapabilitiesService} from '../../../common/wfs/get-capabilities.service';

@Component({
  selector: 'hs-add-layers-wfs',
  templateUrl: './add-wfs-layer.directive.html',
})
export class HsAddLayersWfsComponent {
  url: any;
  error: any;
  add_all: any;
  isChecked: boolean;
  map_projection: any;
  loadingFeatures: boolean;
  showDetails: boolean;
  folder_name: any;
  title = '';

  path = 'WFS';
  loaderImage = require('../../../img/ajax-loader.gif');

  constructor(
    public HsAddLayersWfsService: HsAddLayersWfsService,
    public HsDialogContainerService: HsDialogContainerService,
    public hsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsMapService: HsMapService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService
  ) {
    this.map_projection = this.HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();

    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      ({type, response}) => {
        if (type === 'WFS') {
          try {
            this.HsAddLayersWfsService.parseCapabilities(response);
          } catch (e) {
            if (e.status == 401) {
              this.HsAddLayersWfsService.wfsCapabilitiesError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.HsAddLayersWfsService.wfsCapabilitiesError.next(e);
          }
        }
      }
    );

    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wfs') {
        this.setUrlAndConnect(uri);
      }
    });

    this.HsAddLayersWfsService.wfsCapabilitiesError.subscribe((e) => {
      this.hsLog.warn(e);
      this.url = null;
      this.showDetails = false;

      this.error = e.toString();
      // const previousDialog = HsLayoutService.contentWrapper.querySelector(
      //   '.hs-ows-wms-capabilities-error'
      // );
      // if (previousDialog) {
      //   previousDialog.parentNode.removeChild(previousDialog);
      // }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        this.error
      );
      //throw "WMS Capabilities parsing problem";
    });
  }

  /**
   * @function clear
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.url = '';
    this.showDetails = false;
  }

  connect = (): void => {
    this.HsWfsGetCapabilitiesService.requestGetCapabilities(this.url);
    this.showDetails = true;
  };

  /**
   * @function setUrlAndConnect
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   */
  setUrlAndConnect(url: string): void {
    this.url = url;
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
   * @function tryAddLayers
   * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
   * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
   */
  tryAddLayers(checked: boolean): void {
    this.add_all = checked;
    this.addLayers(checked);
  }

  checked(): boolean {
    for (const layer of this.HsAddLayersWfsService.services) {
      if (layer.checked) {
        return true;
      }
    }
    return false;
  }

  changed(): void {
    this.isChecked = this.checked();
  }

  /**
   * @function addLayers
   * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param {boolean} checked - Add all available layers or olny checked ones. Checked=false=all
   */
  addLayers(checked: boolean): void {
    for (const layer of this.HsAddLayersWfsService.services) {
      this.recurse(layer, checked);
    }
  }

  recurse(layer, checked: boolean): void {
    if (!checked || layer.checked) {
      this.addLayer(
        layer,
        layer.Title.replace(/\//g, '&#47;'),
        this.folder_name,
        this.HsAddLayersWfsService.srs
      );
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.recurse(sublayer, checked);
      }
    }
  }

  /**
   * @function addLayer
   * @private
   * @description (PRIVATE) Add selected layer to map???
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} folder name
   * @param {OpenLayers.Projection} srs of the layer
   */
  addLayer(layer, layerName: string, folder: string, srs): void {
    const options = {
      layer: layer,
      url: this.HsWfsGetCapabilitiesService.service_url.split('?')[0],
      strategy: bbox,
      srs: srs,
    };

    const new_layer = new VectorLayer({
      title: layerName,
      source: this.HsAddLayersWfsService.createWfsSource(options),
      path: this.path,
      renderOrder: null,
      synchronize: false,
    });
    this.HsMapService.map.addLayer(new_layer);
    this.HsLayoutService.setMainPanel('layermanager');
  }
}

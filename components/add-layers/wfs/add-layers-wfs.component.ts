import * as angular from 'angular';

import {Component} from '@angular/core';

import '../../../common/get-capabilities.module';
import '../../utils/utils.module';
import VectorLayer from 'ol/layer/Vector';
import {bbox} from 'ol/loadingstrategy';

import {HsAddLayersWfsService} from './add-layers-wfs-service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsWfsGetCapabilitiesService} from '../../../common/wfs/get-capabilities.service';

@Component({
  selector: 'hs-add-layers-wfs',
  template: require('./add-wfs-layer.directive.html'),
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

  constructor(
    private HsMapService: HsMapService,
    private HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    private HsLayoutService: HsLayoutService,
    private HsAddLayersWfsService: HsAddLayersWfsService,
    private hsEventBusService: HsEventBusService,
    private HsDialogContainerService: HsDialogContainerService
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
      if (console) {
        console.warn(e);
      }
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

  path = 'WFS';
  loaderImage = require('../../../img/ajax-loader.gif');
  /**
   * Clear Url and hide detailsWms
   *
   * @memberof hs.addLayers
   * @function clear
   */
  clear() {
    this.url = '';
    this.showDetails = false;
  }

  connect() {
    this.HsWfsGetCapabilitiesService.requestGetCapabilities(this.url);
    this.showDetails = true;
  }

  /**
   * Connect to service of specified Url
   *
   * @memberof hs.addLayersWms
   * @function setUrlAndConnect
   * @param {string} url Url of requested service
   * @param {string} type Type of requested service
   */
  setUrlAndConnect(url) {
    this.url = url;
    this.connect();
  }

  /**
   * @param layers
   * @function selectAllLayers
   * @memberOf hs.addLayersWfs
   * @description Select all layers from service.
   */
  selectAllLayers(layers) {
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
   * @memberOf hs.addLayersWfs
   * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
   * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
   */
  tryAddLayers(checked) {
    this.add_all = checked;
    this.addLayers(checked);
    return;
  }
  checked() {
    for (const layer of this.HsAddLayersWfsService.services) {
      if (layer.checked) {
        return true;
      }
    }
    return false;
  }
  changed() {
    this.isChecked = this.checked();
    console.log(this.isChecked);
  }
  /**
   * @function addLayers
   * @memberOf hs.addLayersWfs
   * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param {boolean} checked - Add all available layers or olny checked ones. Checked=false=all
   */
  addLayers(checked) {
    for (const layer of this.HsAddLayersWfsService.services) {
      this.recurse(layer, checked);
    }
  }

  recurse(layer, checked) {
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
   * @memberOf hs.addLayersWfs
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} folder name
   * @param {OpenLayers.Projection} srs of the layer
   * (PRIVATE) Add selected layer to map???
   */
  addLayer(layer, layerName, folder, srs) {
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

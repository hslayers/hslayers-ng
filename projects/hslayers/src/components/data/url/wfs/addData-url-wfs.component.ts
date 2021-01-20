import VectorLayer from 'ol/layer/Vector';
import {Component} from '@angular/core';
import {bbox} from 'ol/loadingstrategy';
import {transformExtent} from 'ol/proj';

import {HsAddDataWfsService} from './addData-url-wfs.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../../common/capabilities-error-dialog.component';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/wfs/get-capabilities.service';

@Component({
  selector: 'hs-add-data-url-wfs',
  templateUrl: './addData-wfs-layer.directive.html',
})
export class HsAddDataWfsComponent {
  url: string;
  error: any;
  addAll: boolean;
  isChecked: boolean;
  mapProjection: any;
  loadingFeatures: boolean;
  showDetails: boolean;
  title = ''; //FIXME: unused
  layerToAdd: string;

  folderName = 'WFS';

  constructor(
    public HsAddDataWfsService: HsAddDataWfsService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsMapService: HsMapService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService
  ) {
    this.HsEventBusService.olMapLoads.subscribe(() => {
      this.mapProjection = this.HsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });

    this.HsEventBusService.owsCapabilitiesReceived.subscribe(
      async ({type, response}) => {
        if (type === 'WFS') {
          try {
            const bbox = await this.HsAddDataWfsService.parseCapabilities(
              response
            );
            if (this.layerToAdd) {
              for (const layer of this.HsAddDataWfsService.services) {
                //TODO: If Layman allows layers with different casing,
                // then remove the case lowering
                if (
                  layer.Title.toLowerCase() === this.layerToAdd.toLowerCase()
                ) {
                  layer.checked = true;
                }
              }
              this.addLayers(true);
              this.layerToAdd = null;
              this.zoomToBBox(bbox);
            }
          } catch (e) {
            if (e.status == 401) {
              this.HsAddDataWfsService.wfsCapabilitiesError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.HsAddDataWfsService.wfsCapabilitiesError.next(e);
          }
        }
      }
    );

    this.HsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wfs') {
        this.layerToAdd = layer;
        this.setUrlAndConnect(uri);
      }
    });

    this.HsAddDataWfsService.wfsCapabilitiesError.subscribe((e) => {
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

  /**
   * @function addLayers
   * @description First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param {boolean} checkedOnly Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): void {
    this.addAll = checkedOnly;
    for (const layer of this.HsAddDataWfsService.services) {
      this.addLayersRecursively(layer);
    }
  }

  private addLayersRecursively(layer): void {
    if (!this.addAll || layer.checked) {
      this.addLayer(
        layer,
        layer.Title.replace(/\//g, '&#47;'),
        this.hsUtilsService.undefineEmptyString(this.folderName),
        this.HsAddDataWfsService.srs
      );
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer);
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
  private addLayer(layer, layerName: string, folder: string, srs): void {
    const options = {
      layer: layer,
      url: this.HsWfsGetCapabilitiesService.service_url.split('?')[0],
      strategy: bbox,
      srs: srs,
    };

    const new_layer = new VectorLayer({
      title: layerName,
      source: this.HsAddDataWfsService.createWfsSource(options),
      path: folder,
      renderOrder: null,
      removable: true,
    });
    this.HsMapService.map.addLayer(new_layer);
    this.HsLayoutService.setMainPanel('layermanager');
  }

  private zoomToBBox(bbox: any) {
    if (!bbox) {
      return;
    }
    if (bbox.LowerCorner) {
      bbox = [
        bbox.LowerCorner.split(' ')[0],
        bbox.LowerCorner.split(' ')[1],
        bbox.UpperCorner.split(' ')[0],
        bbox.UpperCorner.split(' ')[1],
      ];
    }
    const extent = transformExtent(bbox, 'EPSG:4326', this.mapProjection);
    if (extent) {
      this.HsMapService.map
        .getView()
        .fit(extent, this.HsMapService.map.getSize());
    }
  }
}

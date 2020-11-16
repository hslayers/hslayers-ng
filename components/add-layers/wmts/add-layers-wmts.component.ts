import {Component} from '@angular/core';

import '../../../common/get-capabilities';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {addAnchors} from '../../../common/attribution-utils';

import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {HsLogService} from '../../../common/log/log.service';
import {Tile} from 'ol/layer';
import {WMTS} from 'ol/source';
import {get} from 'ol/proj';
import {getTopLeft, getWidth} from 'ol/extent';

@Component({
  selector: 'hs-add-layers-wmts',
  templateUrl: './add-wmts-layer.directive.html',
})
export class HsAddLayersWmtsComponent {
  capabilities;
  currentLayer;
  description;
  error;
  imageFormat = '';
  layerTileMatrix;
  mapProjection: string;
  services;
  style = '';
  tileMatrixSet = '';
  title;
  tileURL;
  version;

  constructor(
    private hsEventBusService: HsEventBusService,
    private hsLayoutService: HsLayoutService,
    private hsLog: HsLogService,
    private hsMapService: HsMapService,
    private HsDialogContainerService: HsDialogContainerService
  ) {
    this.mapProjection = this.hsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();

    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      ({type, response}) => {
        if (type === 'WMTS') {
          this.capabilitiesReceived(response);
        }
      }
    );
  }

  capabilitiesReceived(response): void {
    try {
      const parser = new WMTSCapabilities();
      this.capabilities = parser.read(response);
      const caps = this.capabilities;
      this.title = caps.ServiceIdentification.Title;
      this.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
      for (
        let idx = 0;
        idx < caps.OperationsMetadata.GetTile.DCP.HTTP.Get.length;
        idx++
      ) {
        if (
          caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].Constraint[0]
            .AllowedValues.Value[0] == 'KVP'
        ) {
          this.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].href;
          break;
        }
      }
      this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.version = caps.Version || caps.version;
      this.services = caps.Contents;
    } catch (e) {
      if (console) {
        this.hsLog.log(e);
      }
      this.error = e.toString();
      const previousDialog = this.hsLayoutService.contentWrapper.querySelector(
        '.hs-ows-wms-capabilities-error'
      );
      if (previousDialog) {
        previousDialog.parentNode.removeChild(previousDialog);
      }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        this.error
      );
      //FIXME: $compile(el)($scope);
      //throw "wmts Capabilities parsing problem";
    }
  }

  /**
   * @function setCurrentLayer
   * @description Opens detailed view for manipulating layer
   * @param {object} layer - Wrapped layer to edit or view
   * @param {number} index - Used to position the detail panel after layers li element
   */
  setCurrentLayer(layer, index: number): void {
    if (this.currentLayer == layer) {
      this.currentLayer = null;
    } else {
      this.currentLayer = layer;
      const wmtsLayerPanel = this.hsLayoutService.contentWrapper.querySelector(
        '.hs-wmts-layerpanel'
      );
      const layerNode = this.hsLayoutService.contentWrapper.querySelector(
        '#wmtslayer-' + index
      );
      if (wmtsLayerPanel) {
        layerNode.parentNode.insertBefore(
          wmtsLayerPanel,
          layerNode.nextSibling
        );
      }
    }
  }

  /**
   * @function addLayer
   * @description Add layer to map
   * @param {object} layer - Wrapped layer to add
   */
  addLayer(layer): void {
    const projection = get(this.mapProjection);
    const projectionExtent = projection.getExtent();
    for (const tileMatrixSetItem of this.services.TileMatrixSet) {
      if (tileMatrixSetItem.Identifier == this.tileMatrixSet) {
        this.layerTileMatrix = tileMatrixSetItem;
      }
    }
    const size =
      getWidth(projectionExtent) / this.layerTileMatrix.TileMatrix[0].TileWidth;
    const resolutions = new Array(this.layerTileMatrix.TileMatrix.length);
    const matrixIds = new Array(this.layerTileMatrix.TileMatrix.length);
    for (let z = 0; z < this.layerTileMatrix.TileMatrix.length; ++z) {
      // generate resolutions and matrixIds arrays for this WMTS
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }

    const dimensions = {};

    for (const val of layer.Dimension) {
      dimensions[val.name] = val;
    }

    const new_layer = new Tile({
      title: layer.Title,
      source: new WMTS({
        url: this.tileURL,
        layer: layer.Identifier,
        projection: projection,
        matrixSet: 'EPSG:3857',
        format: this.imageFormat,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds,
        }),
        style: this.style,
        wrapX: true,
      }),
      saveState: true,
      removable: true,
      dimensions: dimensions,
    });

    this.hsMapService.addLayer(new_layer, true);
  }
}

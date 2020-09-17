import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';

import '../../../common/get-capabilities.module';
import {addAnchors} from '../../../common/attribution-utils';

import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {Tile} from 'ol/layer';
import {WMTS} from 'ol/source';
import {get} from 'ol/proj';
import {getTopLeft, getWidth} from 'ol/extent';

@Component({
  selector: 'hs-add-layers-wmts',
  template: require('./add-wmts-layer.directive.html'),
})
export class HsAddLayersWmtsComponent {
  constructor($scope, HsMapService, $compile, HsLayoutService, $log) {
    'ngInject';
    $scope.map_projection = HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();
    $scope.style = '';
    $scope.tileMatrixSet = '';
    $scope.image_format = '';

    $scope.capabilitiesReceived = function (response) {
      try {
        const parser = new WMTSCapabilities();
        $scope.capabilities = parser.read(response);
        const caps = $scope.capabilities;
        $scope.title = caps.ServiceIdentification.Title;
        $scope.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
        for (
          let idx = 0;
          idx < caps.OperationsMetadata.GetTile.DCP.HTTP.Get.length;
          idx++
        ) {
          if (
            caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].Constraint[0]
              .AllowedValues.Value[0] == 'KVP'
          ) {
            $scope.tileURL =
              caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].href;
            break;
          }
        }
        $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
        $scope.version = caps.Version || caps.version;
        $scope.services = caps.Contents;
      } catch (e) {
        if (console) {
          $log.log(e);
        }
        $scope.error = e.toString();
        const previousDialog = HsLayoutService.contentWrapper.querySelector(
          '.hs-ows-wms-capabilities-error'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.wmts.capabilities_error_directive></div>'
        );
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
        //throw "wmts Capabilities parsing problem";
      }
    };

    $scope.$on('ows_wmts.capabilities_received', (event, response) => {
      $scope.capabilitiesReceived(response.data);
    });

    /**
     * @function setCurrentLayer
     * @memberOf hs.addLayersWmts.controller
     * @description Opens detailed view for manipulating layer
     * @param {object} layer - Wrapped layer to edit or view
     * @param {number} index - Used to position the detail panel after layers li element
     */
    $scope.setCurrentLayer = function (layer, index) {
      if ($scope.currentLayer == layer) {
        $scope.currentLayer = null;
      } else {
        $scope.currentLayer = layer;
        const wmtsLayerPanel = HsLayoutService.contentWrapper.querySelector(
          '.hs-wmts-layerpanel'
        );
        const layerNode = HsLayoutService.contentWrapper.querySelector(
          '#wmtslayer-' + index
        );
        if (wmtsLayerPanel) {
          layerNode.parentNode.insertBefore(
            wmtsLayerPanel,
            layerNode.nextSibling
          );
        }
      }
    };

    /**
     * @function addLayer
     * @memberOf hs.addLayersWmts.controller
     * @description Add layer to map
     * @param {object} layer - Wrapped layer to add
     */

    $scope.addLayer = function (layer) {
      const projection = get($scope.map_projection);
      const projectionExtent = projection.getExtent();
      for (let idx = 0; idx < $scope.services.TileMatrixSet.length; idx++) {
        if (
          $scope.services.TileMatrixSet[idx].Identifier == $scope.tileMatrixSet
        ) {
          $scope.layerTileMatrix = $scope.services.TileMatrixSet[idx];
        }
      }
      const size =
        getWidth(projectionExtent) /
        $scope.layerTileMatrix.TileMatrix[0].TileWidth;
      const resolutions = new Array($scope.layerTileMatrix.TileMatrix.length);
      const matrixIds = new Array($scope.layerTileMatrix.TileMatrix.length);
      for (let z = 0; z < $scope.layerTileMatrix.TileMatrix.length; ++z) {
        // generate resolutions and matrixIds arrays for this WMTS
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
      }

      const dimensions = {};

      angular.forEach(layer.Dimension, (val) => {
        dimensions[val.name] = val;
      });

      const new_layer = new Tile({
        title: layer.Title,
        source: new WMTS({
          url: $scope.tileURL,
          layer: layer.Identifier,
          projection: projection,
          matrixSet: 'EPSG:3857',
          format: $scope.image_format,
          tileGrid: new WMTSTileGrid({
            origin: getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds,
          }),
          style: $scope.style,
          wrapX: true,
        }),
        saveState: true,
        removable: true,
        dimensions: dimensions,
      });

      HsMapService.addLayer(new_layer, true);
    };
  }
}

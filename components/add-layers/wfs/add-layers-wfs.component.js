import moment from 'moment';
global.moment = moment;
import VectorLayer from 'ol/layer/Vector';
import {bbox} from 'ol/loadingstrategy';
import {transformExtent} from 'ol/proj';

import '../../../common/get-capabilities.module';
import '../../utils/utils.module';

export default {
  template: require('./add-wfs-layer.directive.html'),
  controller: function (
    $scope,
    HsMapService,
    HsWfsGetCapabilitiesService,
    $compile,
    HsLayoutService,
    $log,
    HsAddLayersWfsService,
    $rootScope
  ) {
    'ngInject';
    $scope.showDetails = false;
    $scope.path = 'WFS';
    $scope.loaderImage = require('../../../img/ajax-loader.gif');
    $scope.service = HsAddLayersWfsService;
    $scope.$on('map.loaded', (e) => {
      $scope.map_projection = HsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
    $scope.$on('ows_wfs.capabilities_received', (event, response) => {
      try {
        HsAddLayersWfsService.parseCapabilities(response).then((bbox) => {
          if ($scope.layerToAdd) {
            for (const layer of HsAddLayersWfsService.services) {
              if (
                layer.Title.toLowerCase() === $scope.layerToAdd.toLowerCase()
              ) {
                layer.checked = true;
              }
            }
            $scope.tryAddLayers(true);
            if (bbox) {
              if (bbox.LowerCorner) {
                bbox = [
                  bbox.LowerCorner.split(' ')[0],
                  bbox.LowerCorner.split(' ')[1],
                  bbox.UpperCorner.split(' ')[0],
                  bbox.UpperCorner.split(' ')[1],
                ];
              }
              const extent = transformExtent(
                bbox,
                'EPSG:4326',
                $scope.map_projection
              );
              if (extent !== null) {
                HsMapService.map
                  .getView()
                  .fit(extent, HsMapService.map.getSize());
              }
            }
            $scope.layerToAdd = null;
          }
        });
      } catch (e) {
        if (e.status == 401) {
          $rootScope.$broadcast(
            'wfs_capabilities_error',
            'Unauthorized access. You are not authorized to query data from this service'
          );
          return;
        }
        $rootScope.$broadcast('wfs_capabilities_error', e);
      }
    });
    /**
     * Clear Url and hide detailsWms
     *
     * @memberof hs.addLayers
     * @function clear
     */
    $scope.clear = function () {
      $scope.url = '';
      $scope.showDetails = false;
    };

    $scope.connect = function () {
      try {
        HsWfsGetCapabilitiesService.requestGetCapabilities($scope.url);
      } catch (e) {
        console.warn(e);
      }
      $scope.showDetails = true;
    };

    $scope.$on('ows.wfs_connecting', (event, url, layer) => {
      $scope.layerToAdd = layer;
      $scope.setUrlAndConnect(url);
    });
    $scope.$on('wfs_capabilities_error', (event, e) => {
      $log.warn(e);
      $scope.url = null;
      $scope.showDetails = false;

      $scope.error = e.toString();
      const previousDialog = HsLayoutService.contentWrapper.querySelector(
        '.hs-ows-wms-capabilities-error'
      );
      if (previousDialog) {
        previousDialog.parentNode.removeChild(previousDialog);
      }
      const el = angular.element(
        '<div hs.add-layers-wfs.capabilities-error-directive></span>'
      );
      $compile(el)($scope);
      HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      //throw "WMS Capabilities parsing problem";
    });
    /**
     * Connect to service of specified Url
     *
     * @memberof hs.addLayersWms
     * @function setUrlAndConnect
     * @param {string} url Url of requested service
     */
    $scope.setUrlAndConnect = function (url) {
      $scope.url = url;
      $scope.connect();
    };

    /**
     * @function selectAllLayers
     * @memberOf hs.addLayersWfs
     * @description Select all layers from service.
     */
    $scope.selectAllLayers = function () {
      /**
       * @param layer
       */
      function recurse(layer) {
        layer.checked = !layer.checked;

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach(HsAddLayersWfsService.services, (layer) => {
        recurse(layer);
      });
      $scope.changed();
    };

    /**
     * @function tryAddLayers
     * @memberOf hs.addLayersWfs
     * @description Callback for "Add layers" button. Proceeds to add layers to the map.
     * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
     */
    $scope.tryAddLayers = function (checked) {
      $scope.add_all = checked;
      $scope.addLayers(checked);
      return;
    };
    $scope.checked = function () {
      for (const layer of HsAddLayersWfsService.services) {
        if (layer.checked) {
          return true;
        }
      }
      return false;
    };
    $scope.changed = function () {
      $scope.isChecked = $scope.checked();
    };
    /**
     * @function addLayers
     * @memberOf hs.addLayersWfs
     * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
     * @param {boolean} checked - Add all available layers or o0lny checked ones. Checked=false=all
     */
    $scope.addLayers = function (checked) {
      /**
       * @param layer
       */
      function recurse(layer) {
        if (!checked || layer.checked) {
          addLayer(
            layer,
            layer.Title.replace(/\//g, '&#47;'),
            $scope.folder_name,
            HsAddLayersWfsService.srs
          );
        }

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach(HsAddLayersWfsService.services, (layer) => {
        recurse(layer);
      });
    };

    /**
     * @function addLayer
     * @memberOf hs.addLayersWfs
     * @param {object} layer capabilities layer object
     * @param {string} layerName layer name in the map
     * @param {string} folder name
     * @param {OpenLayers.Projection} srs of the layer
     * (PRIVATE) Add selected layer to map???
     */
    function addLayer(layer, layerName, folder, srs) {
      const options = {
        layer: layer,
        url: HsWfsGetCapabilitiesService.service_url.split('?')[0],
        strategy: bbox,
        srs: srs,
      };

      const new_layer = new VectorLayer({
        title: layerName,
        source: HsAddLayersWfsService.createWfsSource(options),
        path: $scope.path,
        renderOrder: null,
      });
      HsMapService.map.addLayer(new_layer);
      HsLayoutService.setMainPanel('layermanager');
    }
  },
};

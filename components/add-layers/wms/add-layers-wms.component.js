import {transformExtent} from 'ol/proj';

import '../../../common/get-capabilities.module';
import '../../utils/utils.module';

export default {
  template: function (HsConfig) {
    'ngInject';
    return HsConfig.design == 'md'
      ? require('./add-wms-layer.md.directive.html')
      : require('./add-wms-layer.directive.html');
  },
  controller: function (
    $scope,
    HsWmsGetCapabilitiesService,
    HsAddLayersWmsAddLayerService,
    HsHistoryListService,
    HsMapService,
    $timeout
  ) {
    'ngInject';
    $scope.data = HsAddLayersWmsAddLayerService.data;
    $scope.HsAddLayersWmsAddLayerService = HsAddLayersWmsAddLayerService;
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

    /**
     * @param {string} [layerToSelect]
     */
    $scope.connect = function (layerToSelect) {
      HsHistoryListService.addSourceHistory('Wms', $scope.url);
      HsWmsGetCapabilitiesService.requestGetCapabilities($scope.url)
        .then((capabilities) => {
          $timeout((_) => {
            HsAddLayersWmsAddLayerService.capabilitiesReceived(
              capabilities,
              layerToSelect
            ).then((data) => {
              if (layerToSelect) {
                $scope.addLayers(true);
                if (data && data.extent) {
                  const extent = transformExtent(
                    data.extent,
                    'EPSG:4326',
                    HsMapService.map.getView().getProjection()
                  );
                  if (extent !== null) {
                    HsMapService.map
                      .getView()
                      .fit(extent, HsMapService.map.getSize());
                  }
                }
              }
            });
          }, 0);
        })
        .catch((e) => console.warn(e));
      $scope.showDetails = true;
    };

    $scope.$on('ows.wms_connecting', (event, wms, layer) => {
      $scope.setUrlAndConnect(wms, layer);
    });

    /**
     * @function selectAllLayers
     * @memberOf hs.addLayersWms.controller
     * @description Select all layers from service.
     */
    $scope.selectAllLayers = function () {
      /**
       * @param layer
       */
      function recurse(layer) {
        layer.checked = true;

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach($scope.data.services.Layer, (layer) => {
        recurse(layer);
      });
    };

    $scope.addLayers = function (checked) {
      HsAddLayersWmsAddLayerService.addLayers(checked);
    };

    $scope.srsChanged = function () {
      HsAddLayersWmsAddLayerService.srsChanged();
    };
    $scope.checkboxChange = function (changed) {
      HsAddLayersWmsAddLayerService.checkboxChange(changed);
    };
    /**
     * Connect to service of specified Url
     *
     * @memberof hs.addLayersWms
     * @function setUrlAndConnect
     * @param {string} url Url of requested service
     * @param {string} [layer] Optional layer to select, when
     * getCapabilities arrives
     */
    $scope.setUrlAndConnect = function (url, layer) {
      $scope.url = url;
      $scope.connect(layer);
    };

    $scope.sourceHistory = HsAddLayersWmsAddLayerService.sourceHistory;

    $scope.getDimensionValues =
      HsAddLayersWmsAddLayerService.getDimensionValues;

    $scope.hasNestedLayers = HsAddLayersWmsAddLayerService.hasNestedLayers;
  },
};

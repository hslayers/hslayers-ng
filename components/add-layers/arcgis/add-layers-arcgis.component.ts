import '../../utils';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';
import * as angular from 'angular';

export default {
  template: function (HsConfig) {
    'ngInject';
    return HsConfig.design == 'md'
      ? require('./add-arcgis-layer.md.directive.html')
      : require('./add-arcgis-layer.directive.html');
  },
  controller: function (
    $scope,
    HsArcgisGetCapabilitiesService,
    HsAddLayersArcgisAddLayerService,
    HsHistoryListService,
    $timeout
  ) {
    'ngInject';
    $scope.data = HsAddLayersArcgisAddLayerService.data;
    /**
     * Clear Url and hide detailsArcgis
     *
     * @memberof hs.addLayers
     * @function clear
     */
    $scope.clear = function () {
      $scope.url = '';
      $scope.showDetails = false;
    };

    $scope.connect = function (layerToSelect) {
      HsHistoryListService.addSourceHistory('Arcgis', $scope.url);
      HsArcgisGetCapabilitiesService.requestGetCapabilities($scope.url).then(
        (capabilities) => {
          HsAddLayersArcgisAddLayerService.data.getMapUrl = $scope.url;
          $timeout((_) => {
            HsAddLayersArcgisAddLayerService.capabilitiesReceived(
              capabilities,
              layerToSelect
            );
          }, 0);
        }
      );
      $scope.showDetails = true;
    };

    $scope.$on('ows.arcgis_connecting', (event, url, layer) => {
      $scope.setUrlAndConnect(url, layer);
    });

    /**
     * @function selectAllLayers
     * @memberOf hs.addLayersArcgis.controller
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
      HsAddLayersArcgisAddLayerService.addLayers(checked);
    };

    $scope.srsChanged = function () {
      HsAddLayersArcgisAddLayerService.srsChanged();
    };

    /**
     * Connect to service of specified Url
     *
     * @memberof hs.addLayersArcgis
     * @function setUrlAndConnect
     * @param {string} url Url of requested service
     * @param {string} layer Optional layer to select, when
     * getCapabilities arrives
     */
    $scope.setUrlAndConnect = function (url, layer) {
      $scope.url = url;
      $scope.connect(layer);
    };

    $scope.sourceHistory = HsAddLayersArcgisAddLayerService.sourceHistory;

    $scope.getDimensionValues =
      HsAddLayersArcgisAddLayerService.getDimensionValues;

    $scope.hasNestedLayers = HsAddLayersArcgisAddLayerService.hasNestedLayers;
  },
};

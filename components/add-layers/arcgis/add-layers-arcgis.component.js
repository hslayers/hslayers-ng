import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';

export default {
    template: ['config', function (config) {
        return config.design == 'md' ?
            require('./add-arcgis-layer.md.directive.html') :
            require('./add-arcgis-layer.directive.html')
    }],
    controller: ['$scope', '$element', 'hs.map.service', 'Core', 'hs.arcgis.getCapabilitiesService', 'hs.addLayersArcgis.addLayerService', 'hs.historyListService','$timeout', function ($scope, $element, OlMap, Core, arcgisGetCapabilitiesService, LayService, historyListService, $timeout) {
        $scope.data = LayService.data;
        /**
        * Clear Url and hide detailsArcgis
        * @memberof hs.addLayers
        * @function clear
        */
        $scope.clear = function () {
            $scope.url = '';
            $scope.showDetails = false;
        }

        $scope.connect = function (layerToSelect) {
            historyListService.addSourceHistory('Arcgis', $scope.url);
            arcgisGetCapabilitiesService.requestGetCapabilities($scope.url)
                .then((capabilities) => {
                    LayService.data.getMapUrl = $scope.url;
                    $timeout(_ => {
                        LayService.capabilitiesReceived(capabilities, layerToSelect);
                    }, 0)
                });
            $scope.showDetails = true;
        }

        $scope.$on('ows.arcgis_connecting', function (event, url, layer) {
            $scope.setUrlAndConnect(url, layer);
        });

        /**
         * @function selectAllLayers
         * @memberOf hs.addLayersArcgis.controller
         * @description Select all layers from service.
         */
        $scope.selectAllLayers = function () {
            var recurse = function (layer) {
                layer.checked = true;

                angular.forEach(layer.Layer, function (sublayer) {
                    recurse(sublayer)
                })
            }
            angular.forEach($scope.data.services.Layer, function (layer) {
                recurse(layer)
            });
        }

        $scope.addLayers = function (checked) {
            LayService.addLayers(checked);
        }

        $scope.srsChanged = function () {
            LayService.srsChanged();
        }

        /**
        * Connect to service of specified Url
        * @memberof hs.addLayersArcgis
        * @function setUrlAndConnect
        * @param {String} url Url of requested service
        * @param {String} layer Optional layer to select, when 
        * getCapabilities arrives
        */
        $scope.setUrlAndConnect = function (url, layer) {
            $scope.url = url;
            $scope.connect(layer);
        }

        $scope.sourceHistory = LayService.sourceHistory;

        $scope.getDimensionValues = LayService.getDimensionValues;

        $scope.hasNestedLayers = LayService.hasNestedLayers;
    }
    ]
}
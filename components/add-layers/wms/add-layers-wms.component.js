import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';

export default {
    template: ['config', function (config) {
        return config.design == 'md' ?
            require('./add-wms-layer.md.directive.html') :
            require('./add-wms-layer.directive.html')
    }],
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.wms.getCapabilitiesService', 'hs.addLayersWms.addLayerService', 'hs.historyListService','$timeout', function ($scope, OlMap, Core, wmsGetCapabilitiesService, LayService, historyListService, $timeout) {
        $scope.data = LayService.data;

        /**
        * Clear Url and hide detailsWms
        * @memberof hs.addLayers
        * @function clear
        */
        $scope.clear = function () {
            $scope.url = '';
            $scope.showDetails = false;
        }

        $scope.connect = function (layerToSelect) {
            historyListService.addSourceHistory('Wms', $scope.url);
            wmsGetCapabilitiesService.requestGetCapabilities($scope.url)
                .then((capabilities) => {
                    $timeout(_ => {
                        LayService.capabilitiesReceived(capabilities, layerToSelect);
                    }, 0)
                });
            $scope.showDetails = true;
        }

        $scope.$on('ows.wms_connecting', function (event, wms, layer) {
            $scope.setUrlAndConnect(wms, layer);
        });

        /**
         * @function selectAllLayers
         * @memberOf hs.addLayersWms.controller
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
        * @memberof hs.addLayersWms
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
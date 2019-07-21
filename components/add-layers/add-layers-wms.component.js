import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import '../../common/get-capabilities.module';

export default {
    template: ['config', function (config) {
        return config.design == 'md' ?
            require('components/add-layers/partials/add-wms-layer.md.directive.html') :
            require('components/add-layers/partials/add-wms-layer.directive.html')
    }],
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.wms.getCapabilitiesService', 'hs.addLayersWms.addLayerService', 'hs.historyListService', function ($scope, OlMap, Core, wmsGetCapabilitiesService, LayService, historyListService) {
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

        $scope.connect = function () {
            historyListService.addSourceHistory('Wms', $scope.url);
            wmsGetCapabilitiesService.requestGetCapabilities($scope.url);
            $scope.showDetails = true;
        }

        $scope.$on('ows.wms_connecting', function (event, wms) {
            $scope.setUrlAndConnect(wms);
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
        * @param {String} type Type of requested service
        */
        $scope.setUrlAndConnect = function (url) {
            $scope.url = url;
            $scope.connect();
        }
        
        $scope.sourceHistory = LayService.sourceHistory;

        $scope.getDimensionValues = LayService.getDimensionValues;

        $scope.hasNestedLayers = LayService.hasNestedLayers;
    }
    ]
}
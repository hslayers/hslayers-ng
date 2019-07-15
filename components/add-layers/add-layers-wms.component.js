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
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.addLayersWms.addLayerService', function ($scope, OlMap, Core, LayService) {
        $scope.data = LayService.data;

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

        $scope.getDimensionValues = LayService.getDimensionValues;

        $scope.hasNestedLayers = LayService.hasNestedLayers;
    }
    ]
}
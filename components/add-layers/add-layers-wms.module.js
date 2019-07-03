import { WMSCapabilities } from 'ol/format';
import 'utils';
import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';
import { Tile, Group, Image as ImageLayer } from 'ol/layer';
import { TileWMS, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { Attribution } from 'ol/control.js';
import hsOwsWmsAddLayerService from './add-layers-wms.service';
import '../../common/get-capabilities.module';

/**
 * @namespace hs.addLayersWms
 * @memberOf hs
 */
angular.module('hs.addLayersWms', ['hs.utils', 'hs.getCapabilities'])

    /**
     * @name hs.addLayersWms.resampleDialogDirective
     * @ngdoc directive
     * @memberOf hs.addLayersWms
     * @description Directive for displaying warning dialog about resampling (proxying) wms service
     */
    .directive('hs.addLayersWms.resampleDialogDirective', ['config', function (config) {
        return {
            template: require('components/add-layers/partials/dialog_proxyconfirm.html'),
            link: function (scope, element, attrs) {
                scope.resampleModalVisible = true;
            }
        };
    }])

    /**
     * @name hs.addLayersWms.capabilitiesErrorDirective
     * @ngdoc directive
     * @memberOf hs.addLayersWms
     * @description Directive for displaying dialog about getCapabilities request error
     */
    .directive('hs.addLayersWms.capabilitiesErrorDirective', ['config', function (config) {
        return {
            template: require('components/add-layers/partials/dialog_getcapabilities_error.html'),
            link: function (scope, element, attrs) {
                scope.capabilitiesErrorModalVisible = true;
            }
        };
    }])

    .service('hs.addLayersWms.addLayerService', hsOwsWmsAddLayerService)

    /**
     * @name hs.addLayersWms.controller
     * @ngdoc controller
     * @memberOf hs.addLayersWms
     * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
     */
    .component('hs.addLayersWms', {
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
    });

import { WMSCapabilities } from 'ol/format';
import 'utils';
import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';
import { Tile, Group, Image as ImageLayer } from 'ol/layer';
import { TileWMS, WMTS, OSM, XYZ } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import {Attribution} from 'ol/control.js';
import hsOwsWmsServiceCapabilities from 'hs.ows.wms.service_capabilities';
import hsOwsWmsAddLayerService from 'hs.ows.wms.addLayerService';

/**
 * @namespace hs.ows.wms
 * @memberOf hs.ows
 */
angular.module('hs.ows.wms', ['hs.utils'])

    /**
     * @name hs.ows.wms.resampleDialogDirective
     * @ngdoc directive
     * @memberOf hs.ows.wms
     * @description Directive for displaying warning dialog about resampling (proxying) wms service
     */
    .directive('hs.ows.wms.resampleDialogDirective', ['config', function (config) {
        return {
            template: require('components/ows/partials/dialog_proxyconfirm.html'),
            link: function (scope, element, attrs) {
                scope.resampleModalVisible = true;
            }
        };
    }])

    /**
     * @name hs.ows.wms.capabilitiesErrorDirective
     * @ngdoc directive
     * @memberOf hs.ows.wms
     * @description Directive for displaying dialog about getCapabilities request error
     */
    .directive('hs.ows.wms.capabilitiesErrorDirective', ['config', function (config) {
        return {
            template: require('components/ows/partials/dialog_getcapabilities_error.html'),
            link: function (scope, element, attrs) {
                scope.capabilitiesErrorModalVisible = true;
            }
        };
    }])

    /**
     * @class hs.ows.wms.service_capabilities
     * @ngdoc service
     * @memberOf hs.ows.wms
     * @description Service for GetCapabilities requests to Wms
     */
    .service("hs.ows.wms.service_capabilities", hsOwsWmsServiceCapabilities) 

    /**
     * @name hs.ows.wms.service_layer_producer
     * @ngdoc service
     * @memberOf hs.ows.wms
     * @description Service for querying what layers are available in a wms and adding them to map
     */
    .service("hs.ows.wms.service_layer_producer", ['hs.map.service', 'hs.ows.wms.service_capabilities', function (OlMap, srv_caps) {
        /**
       * Add service and its layers to project TODO
       * @memberof hs.ows.wms.service_layer_producer
       * @function addService
       * @param {String} url Service url
       * @param {} box TODO
       */
        this.addService = function (url, box) {
            srv_caps.requestGetCapabilities(url).then(function (resp) {
                var ol_layers = srv_caps.service2layers(resp);
                angular.forEach(ol_layers, function () {
                    if (typeof box != 'undefined') box.get('layers').push(this);
                    OlMap.map.addLayer(this);
                });
            })
        }
    }])

    .service('hs.ows.wms.addLayerService', hsOwsWmsAddLayerService) 

    /**
     * @name hs.ows.wms.controller
     * @ngdoc controller
     * @memberOf hs.ows.wms
     * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
     */
    .controller('hs.ows.wms.controller', ['$scope', 'hs.map.service', 'Core', 'hs.ows.wms.addLayerService',
        function ($scope, OlMap, Core, LayService) {
            $scope.data = LayService.data;

            /**
             * @function selectAllLayers
             * @memberOf hs.ows.wms.controller
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
    ]);

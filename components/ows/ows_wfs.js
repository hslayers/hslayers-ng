/**
 * @namespace hs.ows.wfs
 * @memberOf hs.ows
 */
define(['angular', 'ol', 'Jsonix', 'utils'],
    function(angular, ol, Jsonix) {
        angular.module('jsonix_module', []).service('jsonix_service', [function() {
            return Jsonix
        }]);

        var getPreferedFormat = function(formats, preferedFormats) {
            for (i = 0; i < preferedFormats.length; i++) {
                if (formats.indexOf(preferedFormats[i]) > -1) {
                    return (preferedFormats[i]);
                }
            }
            return formats[0];
        }

        var addAnchors = function(url) {
            if (!url) return null;
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return url.replace(exp, "<a href='$1'>$1</a>");
        }

        angular.module('hs.ows.wfs', ['hs.utils', 'jsonix_module'])
            .directive('hs.ows.wfs.capabilitiesErrorDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_getcapabilities_error.html',
                    link: function(scope, element, attrs) {
                        $('#ows-wfs-capabilities-error').modal('show');
                    }
                };
            })

        /**
         * @class hs.ows.wfs.service_capabilities
         * @memberOf hs.ows.wfs
         * @description Service for GetCapabilities requests to Wms
         */
        .service("hs.ows.wfs.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service', 'jsonix_service',
            function($http, OlMap, utils, jsonix_service) {
                var callbacks = [];
                var me = this;

                this.addHandler = function(f) {
                    callbacks.push(f);
                }

                this.getPathFromUrl = function(str) {
                    if (str.indexOf('?') > -1)
                        return str.substring(0, str.indexOf("?"));
                    else
                        return str;
                };

                this.params2String = function(obj) {
                    return obj ? Object.keys(obj).map(function(key) {
                        var val = obj[key];

                        if (Array.isArray(val)) {
                            return val.map(function(val2) {
                                return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                            }).join('&');
                        }

                        return encodeURIComponent(key) + '=' + encodeURIComponent(val);
                    }).join('&') : '';
                };

                this.requestGetCapabilities = function(service_url, callback) {
                    service_url = service_url.replace('&amp;', '&');
                    var params = utils.getParamsFromUrl(service_url);
                    var path = this.getPathFromUrl(service_url);
                    if (angular.isUndefined(params.request) && angular.isUndefined(params.REQUEST)) params.request = 'GetCapabilities';
                    else
                    if (angular.isDefined(params.request)) params.request = 'GetCapabilities';
                    else
                    if (angular.isDefined(params.REQUEST)) params.REQUEST = 'GetCapabilities';
                    if (angular.isUndefined(params.service) && angular.isUndefined(params.SERVICE)) params.service = 'WFS';
                    if (angular.isUndefined(params.version) && angular.isUndefined(params.VERSION)) params.version = '1.1.0';
                    var url = [path, me.params2String(params)].join('?');

                    url = utils.proxify(url);
                    if (callback) {
                        $http.get(url).success(callback);
                    } else {
                        $http.get(url).success(function(resp) {
                            $(callbacks).each(function() {
                                this(resp)
                            })
                        });
                    }
                };


                this.getUrl = function(url, use_proxy) {
                    if (typeof use_proxy == 'undefined' || !use_proxy) return url;
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=WMS';
                }
            }
        ])

        /**
         * @class hs.ows.wfs.controller
         * @memberOf hs.ows.wfs
         * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
         */
        .controller('hs.ows.wfs.controller', ['$scope', 'hs.map.service', 'hs.ows.wfs.service_capabilities', 'Core', '$compile', '$rootScope', 'jsonix_service',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope, jsonix_service) {
                $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                srv_caps.addHandler(function(response) {
                    try {
                        debugger;
                    } catch (e) {
                        if (console) console.log(e);
                        $scope.error = e.toString();
                        $("#hs-dialog-area #ows-wfs-capabilities-error").remove();
                        var el = angular.element('<div hs.ows.wfs.capabilities_error_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                        //throw "WMS Capabilities parsing problem";
                    }
                });

                /**
                 * @function selectAllLayers
                 * @memberOf hs.ows.wfs.controller
                 * @description Select all layers from service.
                 */
                $scope.selectAllLayers = function() {
                        var recurse = function(layer) {
                            layer.checked = true;

                            angular.forEach(layer.Layer, function(sublayer) {
                                recurse(sublayer)
                            })
                        }
                        angular.forEach($scope.services.Layer, function(layer) {
                            recurse(layer)
                        });
                    }
                    /**
                     * @function tryAddLayers
                     * @memberOf hs.ows.wfs.controller
                     * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
                     * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
                     */
                $scope.tryAddLayers = function(checked) {
                    $scope.add_all = checked;
                    $scope.addLayers(checked);
                    return;
                    $scope.addLayers(checked);
                };

                /**
                 * @function addLayers
                 * @memberOf hs.ows.wfs.controller
                 * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
                 * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
                 */
                $scope.addLayers = function(checked) {
                    var recurse = function(layer) {
                        if ((!checked || layer.checked) && typeof layer.Layer === 'undefined')
                            addLayer(
                                layer,
                                layer.Title.replace(/\//g, "&#47;"),
                                $scope.folder_name,
                                $scope.image_format,
                                $scope.query_format,
                                $scope.single_tile,
                                $scope.tile_size,
                                $scope.srs
                            );

                        angular.forEach(layer.Layer, function(sublayer) {
                            recurse(sublayer)
                        })
                    }
                    angular.forEach($scope.services.Layer, function(layer) {
                        recurse(layer)
                    });
                    Core.setMainPanel('layermanager');
                };

                /**
                 * @function addLayer
                 * @memberOf hs.ows.wfs.controller
                 * @param {Object} layer capabilities layer object
                 * @param {String} layerName layer name in the map
                 * @param {String} folder name
                 * @param {String} imageFormat
                 * @param {String} queryFormat
                 * @param {Boolean} singleTile
                 * @param {OpenLayers.Size} tileSize
                 * @param {OpenLayers.Projection} crs of the layer
                 * @description Add selected layer to map
                 */
                var addLayer = function(layer, layerName, folder, imageFormat, query_format, singleTile, tileSize, crs) {
                    OlMap.map.addLayer(new_layer);
                }
            }
        ]);
    })

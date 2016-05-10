/**
 * @namespace hs.ows.wmts
 * @memberOf hs.ows
 */
define(['angular', 'ol', 'utils'],
    function(angular, ol) {
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

        angular.module('hs.ows.wmts', ['hs.utils'])
            /**
             * @class hs.ows.wmts.resampleDialogDirective
             * @memberOf hs.ows.wmts
             * @description Directive for displaying warning dialog about resampling (proxying) wmts service
             */
            .directive('hs.ows.wmts.resampleDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_proxyconfirm.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#ows-wmts-resample-dialog').modal('show');
                    }
                };
            })
            .directive('hs.ows.wmts.capabilitiesErrorDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_getcapabilities_error.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#ows-wmts-capabilities-error').modal('show');
                    }
                };
            })

        /**
         * @class hs.ows.wmts.service_capabilities
         * @memberOf hs.ows.wmts
         * @description Service for GetCapabilities requests to wmts
         */
        .service("hs.ows.wmts.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service',
            function($http, OlMap, utils) {
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
                    if (angular.isUndefined(params.service) && angular.isUndefined(params.SERVICE)) params.service = 'wmts';
                    if (angular.isUndefined(params.version) && angular.isUndefined(params.VERSION)) params.version = '1.3.0';
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

                this.service2layers = function(capabilities_xml) {
                    var parser = new ol.format.wmtsCapabilities();
                    var caps = parser.read(capabilities_xml);
                    var service = caps.Capability.Layer;
                    var srss = caps.Capability.Layer.CRS;
                    var image_formats = caps.Capability.Request.GetMap.Format;
                    var query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
                    var image_format = getPreferedFormat(image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
                    var query_format = getPreferedFormat(query_formats, ["application/vnd.esri.wmts_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wmts_xml", "text/plain", "text/html"]);

                    var tmp = [];
                    $(service).each(function() {
                        if (console) console.log("Load service", this);
                        $(this.Layer).each(function() {
                            layer = this;
                            var attributions = [];
                            if (layer.Attribution) {
                                attributions = [new ol.Attribution({
                                    html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                                })];
                            }
                            var new_layer = new ol.layer.Tile({
                                title: layer.Title.replace(/\//g, "&#47;"),
                                source: new ol.source.Tilewmts({
                                    url: caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource,
                                    attributions: attributions,
                                    styles: layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : undefined,
                                    params: {
                                        LAYERS: layer.Name,
                                        INFO_FORMAT: (layer.queryable ? query_format : undefined),
                                        FORMAT: image_format
                                    },
                                    crossOrigin: null
                                }),
                                abstract: layer.Abstract,
                                useInterimTilesOnError: false,
                                MetadataURL: layer.MetadataURL,
                                BoundingBox: layer.BoundingBox
                            });
                            tmp.push(new_layer);
                        })
                    })
                    return tmp;
                }

                this.getUrl = function(url, use_proxy) {
                    if (typeof use_proxy == 'undefined' || !use_proxy) return url;
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=wmts';
                }

                this.currentProjectionSupported = function(srss) {
                    var found = false;
                    angular.forEach(srss, function(val) {
                        if (OlMap.map.getView().getProjection().getCode().toUpperCase() == val.toUpperCase()) found = true;
                    })
                    return found;
                }

            }
        ])

        /**
         * @class hs.ows.wmts.service_layer_producer
         * @memberOf hs.ows.wmts
         * @description Service for querying what layers are available in a wmts and adding them to map
         */
        .service("hs.ows.wmts.service_layer_producer", ['hs.map.service', 'hs.ows.wmts.service_capabilities', function(OlMap, srv_caps) {
            this.addService = function(url, box) {
                srv_caps.requestGetCapabilities(url, function(resp) {
                    var ol_layers = srv_caps.service2layers(resp);
                    $(ol_layers).each(function() {
                        if (typeof box != 'undefined') box.get('layers').push(this);
                        OlMap.map.addLayer(this);
                    });
                })
            }
        }])

        /**
         * @class hs.ows.wmts.controller
         * @memberOf hs.ows.wmts
         * @description Controller for displaying and setting parameters for wmts and its layers, which will be added to map afterwards
         */
        .controller('hs.ows.wmts.controller', ['$scope', 'hs.map.service', 'hs.ows.wmts.service_capabilities', 'Core', '$compile', '$rootScope',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope) {
                $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                $scope.style = "";
                $scope.tileMatrixSet = "";
                $scope.image_format = "";

                $scope.capabilitiesReceived = function(response) {
                    try {
                        var parser = new ol.format.WMTSCapabilities();
                        $scope.capabilities = parser.read(response);
                        var caps = $scope.capabilities;
                        $scope.title = caps.ServiceIdentification.Title;
                        $scope.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
                        for (var idx = 0; idx < caps.OperationsMetadata.GetTile.DCP.HTTP.Get.length; idx++) {
                            if (caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].Constraint[0].AllowedValues.Value[0] == "KVP") {
                                $scope.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].href;
                                break;
                            }
                        }
                        $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
                        $scope.version = caps.Version || caps.version;
                        $scope.services = caps.Contents;
                    } catch (e) {
                        if (console) console.log(e);
                        $scope.error = e.toString();
                        $("#hs-dialog-area #ows-wmts-capabilities-error").remove();
                        var el = angular.element('<div hs.ows.wmts.capabilities_error_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                        //throw "wmts Capabilities parsing problem";
                    }
                };

                srv_caps.addHandler($scope.capabilitiesReceived);

                /**
                 * @function setCurrentLayer
                 * @memberOf hs.ows.wmts.controller
                 * @description Opens detailed view for manipulating layer
                 * @param {object} layer - Wrapped layer to edit or view
                 * @param {number} index - Used to position the detail panel after layers li element
                 */
                $scope.setCurrentLayer = function(layer, index) {
                    if ($scope.currentlayer == layer) {
                        $scope.currentlayer = null;
                    } else {
                        $scope.currentlayer = layer;
                        $(".wmtslayerpanel").insertAfter($("#wmtslayer-" + index));
                    }
                    return false;
                }

                /**
                 * @function addLayer
                 * @memberOf hs.ows.wmts.controller
                 * @description Add layer to map
                 * @param {object} layer - Wrapped layer to add
                 */

                $scope.addLayer = function(layer) {
                    var projection = ol.proj.get($scope.map_projection);
                    var projectionExtent = projection.getExtent();
                    for (var idx = 0; idx < $scope.services.TileMatrixSet.length; idx++) {
                        if ($scope.services.TileMatrixSet[idx].Identifier == $scope.tileMatrixSet) {
                            $scope.layerTileMatrix = $scope.services.TileMatrixSet[idx];
                        }

                    }
                    var size = ol.extent.getWidth(projectionExtent) / $scope.layerTileMatrix.TileMatrix[0].TileWidth;
                    var resolutions = new Array($scope.layerTileMatrix.TileMatrix.length);
                    var matrixIds = new Array($scope.layerTileMatrix.TileMatrix.length);
                    for (var z = 0; z < $scope.layerTileMatrix.TileMatrix.length; ++z) {
                        // generate resolutions and matrixIds arrays for this WMTS
                        resolutions[z] = size / Math.pow(2, z);
                        matrixIds[z] = z;
                    }

                    var dimensions = {}

                    angular.forEach(layer.Dimension, function(val) {
                        dimensions[val.name] = val;
                    });


                    var new_layer = new ol.layer.Tile({
                        title: layer.Title,
                        source: new ol.source.WMTS({
                            url: $scope.tileURL,
                            layer: layer.Identifier,
                            projection: projection,
                            matrixSet: 'EPSG:3857',
                            format: $scope.image_format,
                            tileGrid: new ol.tilegrid.WMTS({
                                origin: ol.extent.getTopLeft(projectionExtent),
                                resolutions: resolutions,
                                matrixIds: matrixIds
                            }),
                            style: $scope.style,
                            wrapX: true
                        }),
                        saveState: true,
                        removable: true,
                        dimensions: dimensions,
                    });

                    OlMap.map.addLayer(new_layer);
                }
            }
        ]);
    })

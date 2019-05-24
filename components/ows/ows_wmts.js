/**
 * @namespace hs.ows.wmts
 * @memberOf hs.ows
 */
define(['angular', 'ol', 'utils'],
    function(angular, ol) {
    
        /**
        * (PRIVATE) Select format for WFS service
        * @function getPreferedFormat
        * @param {Array} formats List of formats avaiable for service
        * @param {String} preferedFormats List of prefered formats for output 
        * @returns {String} Either one of prefered formats or first first avaiable format  
        */
        var getPreferedFormat = function(formats, preferedFormats) {
            for (i = 0; i < preferedFormats.length; i++) {
                if (formats.indexOf(preferedFormats[i]) > -1) {
                    return (preferedFormats[i]);
                }
            }
            return formats[0];
        }

        /**
        * (PRIVATE) Replace Urls in text by anchor html tag with url
        * @function addAnchors
        * @param {String} url String to look for Urls
        * @returns {String} Text with added anchors 
        */
        var addAnchors = function(url) {
            if (!url) return null;
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return url.replace(exp, "<a href='$1'>$1</a>");
        }

        angular.module('hs.ows.wmts', ['hs.utils'])
            /**
             * @name hs.ows.wmts.resampleDialogDirective
             * @ngdoc directive
             * @memberOf hs.ows.wmts
             * @description Directive for displaying warning dialog about resampling (proxying) wmts service
             */
            .directive('hs.ows.wmts.resampleDialogDirective', ['config', function (config) {
                return {
                    template: require('components/ows/partials/dialog_proxyconfirm.html'),
                    link: function(scope, element, attrs) {
                        scope.resampleModalVisible = true;
                    }
                };
            }])
            /**
             * @name hs.ows.wmts.capabilitiesErrorDirective
             * @ngdoc directive
             * @memberOf hs.ows.wmts
             * @description Directive for displaying dialog about getCapabilities request error
             */
            .directive('hs.ows.wmts.capabilitiesErrorDirective', ['config', function (config) {
                return {
                    template: require('components/ows/partials/dialog_getcapabilities_error.html'),
                    link: function(scope, element, attrs) {
                        scope.capabilitiesErrorModalVisible = true;
                    }
                };
            }])

        /**
         * @name hs.ows.wmts.service_capabilities
         * @ngdoc service
         * @memberOf hs.ows.wmts
         * @description Service for GetCapabilities requests to wmts
         */
        .service("hs.ows.wmts.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service',
            function($http, OlMap, utils) {
                var me = this;

                /**
                * Get WMTS service location without parameters from url string
                * @memberof hs.ows.wmts.service_capabilities
                * @function getPathFromUrl
                * @param {String} str Url string to parse
                * @returns {String} WMTS service Url
                */
                this.getPathFromUrl = function(str) {
                    if (str.indexOf('?') > -1)
                        return str.substring(0, str.indexOf("?"));
                    else
                        return str;
                };

                /**
                * Create WMTS parameter string from parameter object 
                * @memberof hs.ows.wmts.service_capabilities
                * @function param2String
                * @param {Object} obj Object with stored WNS service parameters
                * @returns {String} Parameter string or empty string if no object given 
                */
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
                
                /**
                * Parse added service url and sends GetCapabalities request to WMTS service
                * @memberof hs.ows.wmts.service_capabilities
                * @function requestGetCapabilities
                * @param {String} service_url Raw Url localization of service
                * @returns {Promise} Promise object -  Response to GetCapabalities request
                */
                this.requestGetCapabilities = function(service_url) {
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
                    var promise = $http.get(url);
                    promise.then(function(r) {
                        $rootScope.$broadcast('ows_wmts.capabilities_received', r)
                    });
                    return promise;
                };

                /**
                * Load all layers of selected service to the map
                * @memberof hs.ows.wmts.service_capabilities
                * @function service2layers
                * @param {String} capabilities_xml Xml response of GetCapabilities of selected service
                * @returns {Ol.collection} List of layers from service
                */
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
                    angular.forEach(service, function() {
                        if (console) console.log("Load service", this);
                        angular.forEach(this.Layer, function() {
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
                                    crossOrigin: 'anonymous'
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

                /**
                * (DEPRECATED ?)
                * @memberof hs.ows.wms.service_capabilities
                * @function getUrl
                * @param {} url
                * @param {} use_proxy
                */
                this.getUrl = function(url, use_proxy) {
                    if (typeof use_proxy == 'undefined' || !use_proxy) return url;
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=wmts';
                }

                /**
                * Test if current map projection is in supported projection list
                * @memberof hs.ows.wms.service_capabilities
                * @function currentProjectionSupported
                * @param {Array} srss List of supported projections
                * @returns {Boolean} True if map projection is in list, otherwise false
                */
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
         * @name hs.ows.wmts.service_layer_producer
         * @memberOf hs.ows.wmts
         * @ngdoc service
         * @description Service for querying what layers are available in a wmts and adding them to map
         */
        .service("hs.ows.wmts.service_layer_producer", ['hs.map.service', 'hs.ows.wmts.service_capabilities', function(OlMap, srv_caps) {
            /**
            * Add service and its layers to project TODO
            * @memberof hs.ows.wms.service_layer_producer
            * @function addService
            * @param {String} url Service url
            * @param {} box TODO
            */
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
         * @name hs.ows.wmts.controller
         * @ngdoc controller
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
                        var previousDialog = document.getElementById("ows-wms-capabilities-error");
                        if(previousDialog)
                            previousDialog.parentNode.removeChild(previousDialog);
                        var el = angular.element('<div hs.ows.wmts.capabilities_error_directive></span>');
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
                        $compile(el)($scope);
                        //throw "wmts Capabilities parsing problem";
                    }
                };

                $scope.$on('ows_wmts.capabilities_received', function(event, response) {
                    $scope.capabilitiesReceived(response.data);
                });

                /**
                 * @function setCurrentLayer
                 * @memberOf hs.ows.wmts.controller
                 * @description Opens detailed view for manipulating layer
                 * @param {object} layer - Wrapped layer to edit or view
                 * @param {number} index - Used to position the detail panel after layers li element
                 */
                $scope.setCurrentLayer = function(layer, index) {
                    if ($scope.currentLayer == layer) {
                        $scope.currentLayer = null;
                    } else {
                        $scope.currentLayer = layer;
                        var wmtsLayerPanel = document.getElementsByClassName('wmtslayerpanel');
                        var layerNode = document.getElementById('wmtslayer-' + index);
                        if(wmtsLayerPanel.length>0){
                            wmtsLayerPanel = wmtsLayerPanel[0];
                            layerNode.parentNode.insertBefore(wmtsLayerPanel, layerNode.nextSibling);
                        }
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

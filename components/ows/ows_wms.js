/**
 * @namespace hs.ows.wms
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

        angular.module('hs.ows.wms', ['hs.utils'])
            
            /**
             * @name hs.ows.wms.resampleDialogDirective
             * @ngdoc directive
             * @memberOf hs.ows.wms
             * @description Directive for displaying warning dialog about resampling (proxying) wms service
             */
            .directive('hs.ows.wms.resampleDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_proxyconfirm.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#ows-wms-resample-dialog').modal('show');
                    }
                };
            })
            
            /**
             * @name hs.ows.wms.capabilitiesErrorDirective
             * @ngdoc directive
             * @memberOf hs.ows.wms
             * @description Directive for displaying dialog about getCapabilities request error
             */
            .directive('hs.ows.wms.capabilitiesErrorDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_getcapabilities_error.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        $('#ows-wms-capabilities-error').modal('show');
                    }
                };
            })

        /**
         * @class hs.ows.wms.service_capabilities
         * @ngdoc service
         * @memberOf hs.ows.wms
         * @description Service for GetCapabilities requests to Wms
         */
        .service("hs.ows.wms.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service', '$rootScope',
            function($http, OlMap, utils, $rootScope) {
                var me = this;

                /**
                * Get WMS service location without parameters from url string
                * @memberof hs.ows.wms.service_capabilities
                * @function getPathFromUrl
                * @param {String} str Url string to parse
                * @returns {String} WMS service Url
                */
                this.getPathFromUrl = function(str) {
                    if (str.indexOf('?') > -1)
                        return str.substring(0, str.indexOf("?"));
                    else
                        return str;
                };

                /**
                * Create WMS parameter string from parameter object 
                * @memberof hs.ows.wms.service_capabilities
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
                * Parse added service url and sends GetCapabalities request to WMS service
                * @memberof hs.ows.wms.service_capabilities
                * @function requestGetCapabilities
                * @param {String} service_url Raw Url localization of service
                * @returns {Promise} Promise object - Response to GetCapabalities request
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
                    if (angular.isUndefined(params.service) && angular.isUndefined(params.SERVICE)) params.service = 'WMS';
                    if (angular.isUndefined(params.version) && angular.isUndefined(params.VERSION)) params.version = '1.3.0';
                    var url = [path, me.params2String(params)].join('?');

                    url = utils.proxify(url);
                    var promise = $http.get(url);
                    promise.then(function(r) {
                        $rootScope.$broadcast('ows.capabilities_received', r)
                    });
                    return promise;
                };

                /**
                * Load all layers of selected service to the map
                * @memberof hs.ows.wms.service_capabilities
                * @function service2layers
                * @param {String} capabilities_xml Xml response of GetCapabilities of selected service
                * @returns {Ol.collection} List of layers from service
                */
                this.service2layers = function(capabilities_xml) {
                    var parser = new ol.format.WMSCapabilities();
                    var caps = parser.read(capabilities_xml);
                    var service = caps.Capability.Layer;
                    var srss = caps.Capability.Layer.CRS;
                    var image_formats = caps.Capability.Request.GetMap.Format;
                    var query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
                    var image_format = getPreferedFormat(image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
                    var query_format = getPreferedFormat(query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);

                    var tmp = [];
                    $(service).each(function() {
                        if (console) console.log("Load service", this);
                        $(this.Layer).each(function() {
                            layer = this;
                            if (console) console.log("Load service", this);
                            var attributions = [];
                            if (layer.Attribution) {
                                attributions = [new ol.Attribution({
                                    html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                                })];
                            }
                            var new_layer = new ol.layer.Tile({
                                title: layer.Title.replace(/\//g, "&#47;"),
                                source: new ol.source.TileWMS({
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
                            OlMap.proxifyLayerLoader(new_layer, true);
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
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=WMS';
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
         * @name hs.ows.wms.service_layer_producer
         * @ngdoc service
         * @memberOf hs.ows.wms
         * @description Service for querying what layers are available in a wms and adding them to map
         */
        .service("hs.ows.wms.service_layer_producer", ['hs.map.service', 'hs.ows.wms.service_capabilities', function(OlMap, srv_caps) {
             /**
            * Add service and its layers to project TODO
            * @memberof hs.ows.wms.service_layer_producer
            * @function addService
            * @param {String} url Service url
            * @param {} box TODO
            */
            this.addService = function(url, box) {
                srv_caps.requestGetCapabilities(url).then(function(resp) {
                    var ol_layers = srv_caps.service2layers(resp);
                    $(ol_layers).each(function() {
                        if (typeof box != 'undefined') box.get('layers').push(this);
                        OlMap.map.addLayer(this);
                    });
                })
            }
        }])

        /**
         * @name hs.ows.wms.controller
         * @ngdoc controller
         * @memberOf hs.ows.wms
         * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
         */
        .controller('hs.ows.wms.controller', ['$scope', 'hs.map.service', 'hs.ows.wms.service_capabilities', 'Core', '$compile', '$rootScope', 'hs.utils.service', '$timeout',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope, utils, $timeout) {
                $scope.use_resampling = false;
                $scope.utils = utils;
                $scope.use_tiles = true;
                $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                $scope.register_metadata = true;

                $scope.capabilitiesReceived = function(response) {
                    try {
                        var parser = new ol.format.WMSCapabilities();
                        $scope.capabilities = parser.read(response);
                        var caps = $scope.capabilities;
                        $scope.title = caps.Service.Title;
                        $scope.description = addAnchors(caps.Service.Abstract);
                        $scope.version = caps.Version || caps.version;
                        $scope.image_formats = caps.Capability.Request.GetMap.Format;
                        $scope.query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
                        $scope.exceptions = caps.Capability.Exception;
                        $scope.srss = [];
                        if (angular.isDefined(caps.Capability.Layer.CRS)) {
                            $scope.srss = caps.Capability.Layer.CRS;
                        } else {
                            $("Capability>Layer>SRS", response).each(function() {
                                $scope.srss.push(this.innerHTML);
                            });
                        }
                        if ($scope.srss.indexOf('CRS:84') > -1) $scope.srss.splice($scope.srss.indexOf('CRS:84'), 1);

                        if (srv_caps.currentProjectionSupported($scope.srss))
                            $scope.srs = $scope.srss.indexOf(OlMap.map.getView().getProjection().getCode()) > -1 ? OlMap.map.getView().getProjection().getCode() : OlMap.map.getView().getProjection().getCode().toLowerCase();
                        else if ($scope.srss.indexOf('EPSG:4326') > -1) {
                            $scope.srs = 'EPSG:4326';
                        } else
                            $scope.srs = $scope.srss[0];
                        $scope.srsChanged();

                        $scope.services = caps.Capability.Layer;

                        $scope.getMapUrl = caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
                        $scope.image_format = getPreferedFormat($scope.image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
                        $scope.query_format = getPreferedFormat($scope.query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);
                    } catch (e) {
                        if (console) console.log(e);
                        $scope.error = e.toString();
                        $("#hs-dialog-area #ows-wms-capabilities-error").remove();
                        var el = angular.element('<div hs.ows.wms.capabilities_error_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                        //throw "WMS Capabilities parsing problem";
                    }
                };

                $scope.$on('ows.capabilities_received', function(event, response) {
                    $scope.capabilitiesReceived(response.data);
                });

                $scope.srsChanged = function() {
                    $scope.resample_warning = !srv_caps.currentProjectionSupported($scope.srss);
                }

                /**
                 * @function selectAllLayers
                 * @memberOf hs.ows.wms.controller
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
                     * @memberOf hs.ows.wms.controller
                     * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
                     * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
                     */
                $scope.tryAddLayers = function(checked) {
                    $scope.add_all = checked;
                    $scope.addLayers(checked);
                    return; //http://redmine.ccss.cz/issues/5224
                    if (!srv_caps.currentProjectionSupported($scope.srss) && $scope.use_resampling == false) {
                        if ($("#hs-dialog-area #ows-wms-resample-dialog").length == 0) {
                            var el = angular.element('<div hs.ows.wms.resample_dialog_directive></span>');
                            $("#hs-dialog-area").append(el)
                            $compile(el)($scope);
                        } else {
                            $('#ows-wms-resample-dialog').modal('show');
                        }
                    } else {
                        $scope.addLayers(checked);
                    }
                };

                /**
                 * @function addLayers
                 * @memberOf hs.ows.wms.controller
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
                 * @memberOf hs.ows.wms.controller
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
                    if (console) console.log(layer);

                    var attributions = [];
                    if (layer.Attribution) {
                        attributions = [new ol.Attribution({
                            html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                        })]
                    }
                    var layer_class = ol.layer.Tile;
                    var source_class = ol.source.TileWMS;

                    if (!$scope.use_tiles) {
                        layer_class = ol.layer.Image;
                        source_class = ol.source.ImageWMS;
                    }

                    var boundingbox = layer.BoundingBox;
                    if (angular.isDefined(crs)) {
                        tmpbox = layer.EX_GeographicBoundingBox;
                        if (angular.isDefined(layer.EX_GeographicBoundingBox)) {
                            boundingbox = layer.EX_GeographicBoundingBox;
                        }
                    } else {
                        if ($scope.map_projection != srs) {
                            boundingbox = layer.LatLonBoundingBox;
                        }
                    }
                    var dimensions = {}

                    angular.forEach(layer.Dimension, function(val) {
                        dimensions[val.name] = val;
                    });

                    var legends = [];
                    if (layer.Style && layer.Style[0].LegendURL) {
                        legends.push(layer.Style[0].LegendURL[0].OnlineResource);
                    }
                    var new_layer = new layer_class({
                        title: layerName,
                        source: new source_class({
                            url: srv_caps.getUrl($scope.getMapUrl, !srv_caps.currentProjectionSupported($scope.srss)),
                            attributions: attributions,
                            projection: $scope.crs || $scope.srs,
                            styles: layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : undefined,
                            params: {
                                LAYERS: layer.Name,
                                INFO_FORMAT: (layer.queryable ? query_format : undefined),
                                FORMAT: $scope.image_format,
                                FROMCRS: $scope.srs,
                                VERSION: $scope.version
                            },
                            crossOrigin: 'anonymous'
                        }),
                        minResolution: layer.MinScaleDenominator,
                        maxResolution: layer.MaxScaleDenominator,
                        saveState: true,
                        removable: true,
                        abstract: layer.Abstract,
                        MetadataURL: layer.MetadataURL,
                        BoundingBox: boundingbox,
                        path: $scope.path,
                        dimensions: dimensions,
                        legends: legends
                    });
                    OlMap.proxifyLayerLoader(new_layer, $scope.use_tiles);
                    OlMap.map.addLayer(new_layer);
                }


                $scope.hasNestedLayers = function(layer) {
                    return typeof layer.Layer !== 'undefined';
                }
            }
        ]);
    })

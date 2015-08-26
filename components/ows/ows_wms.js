/**
 * @namespace hs.ows.wms
 * @memberOf hs.ows
 */
define(['angular', 'ol'],
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

        angular.module('hs.ows.wms', [])
            /**
             * @class hs.ows.wms.resampleDialogDirective
             * @memberOf hs.ows.wms
             * @description Directive for displaying warning dialog about resampling (proxying) wms service
             */
            .directive('hs.ows.wms.resampleDialogDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_proxyconfirm.html',
                    link: function(scope, element, attrs) {
                        $('#ows-wms-resample-dialog').modal('show');
                    }
                };
            })
            .directive('hs.ows.wms.capabilitiesErrorDirective', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/dialog_getcapabilities_error.html',
                    link: function(scope, element, attrs) {
                        $('#ows-wms-capabilities-error').modal('show');
                    }
                };
            })

        /**
         * @class hs.ows.wms.service_capabilities
         * @memberOf hs.ows.wms
         * @description Service for GetCapabilities requests to Wms
         */
        .service("hs.ows.wms.service_capabilities", ['$http', 'hs.map.service',
            function($http, OlMap) {
                var callbacks = [];
                this.addHandler = function(f) {
                    callbacks.push(f);
                }

                this.requestGetCapabilities = function(service_url, callback) {
                    if (callback) {
                        var url = '';
                        if (typeof use_proxy === 'undefined' || use_proxy === true) {
                            url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(service_url + (service_url.indexOf('?') > 0 ? '&' : '?') + "request=GetCapabilities&service=WMS");
                        } else {
                            url = service_url + (service_url.indexOf('?') > 0 ? '' : '?') + "request=GetCapabilities&service=WMS";
                        }
                        $http.get(url).success(callback);
                    } else {
                        var url = '';
                        if (typeof use_proxy === 'undefined' || use_proxy === true) {
                            url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(service_url + (service_url.indexOf('?') > 0 ? '&' : '?') + "request=GetCapabilities&service=WMS");
                        } else {
                            url = service_url + (service_url.indexOf('?') > 0 ? '' : '?') + "request=GetCapabilities&service=WMS";
                        }
                        $http.get(url).success(function(resp) {
                            $(callbacks).each(function() {
                                this(resp)
                            })
                        });
                    }
                };

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
                                    crossOrigin: null
                                }),
                                abstract: layer.Abstract,
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
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=WMS';
                }

                this.currentProjectionSupported = function(srss) {
                    var found = false;
                    angular.forEach(srss, function(val) {
                        if (OlMap.map.getView().getProjection().getCode() == val) found = true;
                    })
                    return found;
                }

            }
        ])

        /**
         * @class hs.ows.wms.service_layer_producer
         * @memberOf hs.ows.wms
         * @description Service for querying what layers are available in a wms and adding them to map
         */
        .service("hs.ows.wms.service_layer_producer", ['hs.map.service', 'hs.ows.wms.service_capabilities', function(OlMap, srv_caps) {
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
         * @class hs.ows.wms.controller
         * @memberOf hs.ows.wms
         * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
         */
        .controller('hs.ows.wms.controller', ['$scope', 'hs.map.service', 'hs.ows.wms.service_capabilities', 'Core', '$compile', '$rootScope',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope) {
                $scope.use_resampling = false;
                srv_caps.addHandler(function(response) {
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
                        if (typeof caps.Capability.Layer.CRS !== 'undefined') {
                            $scope.srss = caps.Capability.Layer.CRS;
                            if (srv_caps.currentProjectionSupported($scope.srss))
                                $scope.srs = OlMap.map.getView().getProjection().getCode();
                            else if ($scope.srss.indexOf('EPSG:4326') > -1) {
                                $scope.srs = 'EPSG:4326';
                            } else
                                $scope.srs = $scope.srss[0];
                        } else {
                            $scope.srs = OlMap.map.getView().getProjection().getCode();
                        }
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
                })

                /**
                 * @function tryAddLayers
                 * @memberOf hs.ows.wms.controller
                 * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
                 * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
                 */
                $scope.tryAddLayers = function(checked) {
                    $scope.add_all = checked;
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
                    /*
            var layerCrs = (typeof(OlMap.map.projection) == typeof("") ? OlMap.map.projection.toUpperCase() : OlMap.map.projection.getCode().toUpperCase());

            var options = {
                    layers: layer.name,
                    transparent: (imageFormat.search("png") > -1 || imageFormat.search("gif") > -1 ? "TRUE" : "FALSE"),
                    format: imageFormat,
                    EXCEPTIONS: "application/vnd.ogc.se_inimage", //application/vnd.ogc.se_xml",
                    VERSION: this.version,
                    INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                    styles: layer.styles.length > 0 ? layer.styles[0].name : undefined
                };

            var maxExtent;
            var layerbbox = null;


            if (layer.llbbox) {
                layerbbox = layer;

                prj = new OpenLayers.Projection("epsg:4326");
                // NOT in 'common' form minx, miny, maxx, maxy, but
                // miny, minx, maxy, maxx
                // FIXME - you never know :-(
                // 1.3.0
                // 0: "48.1524"
                // 1: "12.7353"
                // 2: "51.3809"
                // 3: "17.1419"
                maxExtent = new OpenLayers.Bounds(layerbbox.llbbox[0],
                                                  layerbbox.llbbox[1],
                                                  layerbbox.llbbox[2],
                                                  layerbbox.llbbox[3]);

                var mapBounds = OlMap.map.getMaxExtent().clone();
                mapBounds.transform(OlMap.map.getProjectionObject(), prj);

                // fix sizes
                maxExtent.left = (maxExtent.left < mapBounds.left ? mapBounds.left : maxExtent.left);
                maxExtent.bottom = (maxExtent.bottom < mapBounds.bottom ? mapBounds.bottom : maxExtent.bottom);
                maxExtent.right = (maxExtent.right > mapBounds.right ? mapBounds.right : maxExtent.right);
                maxExtent.top = (maxExtent.top > mapBounds.top ? mapBounds.top : maxExtent.top);

                if (maxExtent.containsBounds(mapBounds)) {
                    maxExtent = OlMap.map.getMaxExtent().clone();
                }
                else {
                    maxExtent.transform(prj, OlMap.map.getProjectionObject());
                }
            }

            switch(this.version) {
                case "1.3.0":
                    options.CRS = layerCrs;
                    options.EXCEPTIONS =  "XML";
                    break;
                default:
                    options.SRS = layerCrs;
                    break;
            }

            var projections = [];

            for (var j in this.srss) {
                var prj;
                try {
                    prj = HSLayers.OWS._Projections[j.toUpperCase()];
                    if (!prj) {
                        prj = new OpenLayers.Projection(j);
                        HSLayers.OWS._Projections[j.toUpperCase()] = prj;
                    }
                    if (prj.proj.readyToUse) {
                        projections.push(prj);
                    }
                }
                catch(e){OpenLayers.Console.log(e);}
            }

            // HACK HACK HACK
            // min and max scale is sometimes parsed in wrong way
            layer.minScale = parseFloat(layer.minScale);
            layer.maxScale = parseFloat(layer.maxScale);
            if (layer.minScale && layer.maxScale && (layer.minScale < layer.maxScale)) {
                var mins = layer.minScale;
                layer.minScale = layer.maxScale;
                layer.maxScale = mins;
            }
            // /HACK HACK HACK


            var minResolution =  (layer.maxScale ? OpenLayers.Util.getResolutionFromScale(layer.maxScale,OlMap.map.baseLayer.units) :
                            OlMap.map.baseLayer.resolutions[OlMap.map.baseLayer.resolutions.length-1]);
            var maxResolution = (layer.minScale ? OpenLayers.Util.getResolutionFromScale(layer.minScale,OlMap.map.baseLayer.units) :
                            OlMap.map.baseLayer.resolutions[0]);

            if (minResolution == Infinity) {
                minResolution = undefined;
                layer.maxScale = undefined;
            }

            if (maxResolution == Infinity) {
                maxResolution = undefined;
                layer.minScale = undefined;
            }

            var obj = {
                formats: []
            };
            layer.formats.map(function(format) {this.formats.push({value: format});},obj);

            var metadataURL = this.getLayerMetadataUrl(layer);
            var layerName = layerName.replace(/\//g,"&#47");
            var params = {
                    isBaseLayer: false,
                    title: layerName,
                    visibility:true,
                    transitionEffect: "resize",
                    singleTile: singleTile,
                    tileSize: tileSize, //|| new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH, OpenLayers.Map.TILE_HEIGHT),
                    abstract: layer.abstract,
                    metadata: {
                        styles: layer.styles,
                        formats: obj.formats
                    },
                    saveWMC: true,
                    path: folder,
                    metadataURL: metadataURL,
                    buffer: 1,
                    ratio: 1,
                    maxExtent: maxExtent,
                    projections: projections,
                    projection: new OpenLayers.Projection(crs),
                    queryable: layer.queryable,
                    wmsMinScale: layer.minScale,
                    wmsMaxScale: layer.maxScale,
                    minResolution: minResolution,
                    maxResolution: maxResolution,
                    dimensions: layer.dimensions,
                    capabilitiesURL: $scope.capabilities.Capability.Request.GetCapabilities.DCPType[0].HTTP.Get.OnlineResource,
                    removable:true
                };

            options.owsService = "WMS";
            //options.owsUrl = this.getMapUrl.href;
            options.fromCRS = crs;

            // unique layer name
            //layerName = this.getUniqueLayerName(layerName);
            var source = new ol.source.TileWMS({
      url: $scope.getMapUrl,
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: layer.attribution
      })],
      params: params,
    }); */
                    var attributions = [];
                    if (layer.Attribution) {
                        attributions = [new ol.Attribution({
                            html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                        })]
                    }
                      var new_layer = new ol.layer.Tile({
                        title: layerName,
                        source: new ol.source.TileWMS({
                            url: srv_caps.getUrl($scope.getMapUrl, !srv_caps.currentProjectionSupported($scope.srss)),
                            attributions: attributions,
                            styles: layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : undefined,
                            params: {
                                LAYERS: layer.Name,
                                INFO_FORMAT: (layer.queryable ? query_format : undefined),
                                FORMAT: $scope.image_format,
                                FROMCRS: $scope.srs,
                                VERSION: $scope.version
                            },
                            crossOrigin: null
                        }),
                        saveState: true,
                        removable: true,
                        abstract: layer.Abstract,
                        MetadataURL: layer.MetadataURL,
                        BoundingBox: layer.BoundingBox,
                        path: $scope.path
                    });

                    OlMap.map.addLayer(new_layer);
                }


                $scope.hasNestedLayers = function(layer) {
                    return typeof layer.Layer !== 'undefined';
                }
            }
        ]);
    })

/**
 * @namespace hs.ows.wfs
 * @memberOf hs.ows
 */
define(['angular', 'ol', 'WfsSource', 'WFSCapabilities', 'utils'],
    function(angular, ol, WfsSource, WFSCapabilities) {

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

        angular.module('hs.ows.wfs', ['hs.utils'])
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
        .service("hs.ows.wfs.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service',
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
                    me.service_url = service_url;
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

                this.currentProjectionSupported = function(srss) {
                    var found = false;
                    angular.forEach(srss, function(val) {
                        if (val.toUpperCase().indexOf(OlMap.map.getView().getProjection().getCode().toUpperCase().replace('EPSG:', 'EPSG::')) > -1) found = true;
                    })
                    return found;
                }

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
        .controller('hs.ows.wfs.controller', ['$scope', 'hs.map.service', 'hs.ows.wfs.service_capabilities', 'Core', '$compile', '$rootScope',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope) {
                $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                srv_caps.addHandler(function(response) {
                    try {
                        caps = new WFSCapabilities(response);
                        $scope.title = caps.ServiceIdentification.Title;
                        $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
                        $scope.version = caps.Version || caps.version;
                        $scope.output_formats = caps.FeatureTypeList.FeatureType[0].OutputFormats;
                        $scope.srss = [caps.FeatureTypeList.FeatureType[0].DefaultCRS];
                        angular.forEach(caps.FeatureTypeList.FeatureType[0].OtherCRS, function(srs) {
                            $scope.srss.push(srs);
                        })

                        if ($scope.srss.indexOf('CRS:84') > -1) $scope.srss.splice($scope.srss.indexOf('CRS:84'), 1);

                        if (srv_caps.currentProjectionSupported($scope.srss))
                            $scope.srs = $scope.srss.indexOf(OlMap.map.getView().getProjection().getCode()) > -1 ? OlMap.map.getView().getProjection().getCode() : OlMap.map.getView().getProjection().getCode().toLowerCase();
                        else if ($scope.srss.indexOf('EPSG::4326') > -1) {
                            $scope.srs = 'EPSG:4326';
                        } else
                            $scope.srs = $scope.srss[0];
                        $scope.services = caps.FeatureTypeList.FeatureType;
                        console.log($scope.services);
                        angular.forEach(caps.OperationsMetadata.Operation, function(operation) {
                            switch (operation.name) {
                                case "DescribeFeatureType":
                                    $scope.describeFeatureType = operation.DCP[0].HTTP.Get;
                                    break;
                                case "GetFeature":
                                    $scope.getFeature = operation.DCP[0].HTTP.Get;
                                    break;
                            }
                        })

                        $scope.output_format = getPreferedFormat($scope.output_formats, ["text/xml; subtype=gml/3.2.1"]);


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
                };

                /**
                 * @function addLayers
                 * @memberOf hs.ows.wfs.controller
                 * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
                 * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
                 */
                $scope.addLayers = function(checked) {
                    var recurse = function(layer) {
                        if (!checked || layer.checked)
                            addLayer(
                                layer,
                                layer.Title.replace(/\//g, "&#47;"),
                                $scope.folder_name,
                                $scope.output_format,
                                $scope.srs
                            );

                        angular.forEach(layer.Layer, function(sublayer) {
                            recurse(sublayer)
                        })
                    }
                    angular.forEach($scope.services, function(layer) {
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
                var addLayer = function(layer, layerName, folder, outputFormat, srs) {
                    if (console) console.log(layer);

                    var url = srv_caps.service_url.split("?")[0];
                    var definition = {};
                    definition.url = url;
                    definition.format = 'hs.format.WFS';

                    var new_layer = new ol.layer.Vector({
                        title: layerName,
                        definition: definition,
                        source: new WfsSource({
                            url: url,
                            typename: layer.Name,
                            projection: srs,
                            version: $scope.version,
                            format: new ol.format.WFS(),
                        }),
                    })


                    OlMap.map.addLayer(new_layer);
                }
            }
        ]);
    })

/**
 * @namespace hs.ows.wfs
 * @memberOf hs.ows
 */
define(['angular', 'ol', 'hs.source.Wfs', 'hs.format.WFSCapabilities', 'utils'],
    function(angular, ol, WfsSource, WFSCapabilities) {

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

        angular.module('hs.ows.wfs', ['hs.utils'])
        
            /**
            * @name hs.ows.wfs.capabalitiesErrorDirective
            * @ngdoc directive
            * @memberOf hs.ows.wfs
            * @description Display GetCapabilities error dialog template
            */
            .directive('hs.ows.wfs.capabilitiesErrorDirective', ['config', function (config) {
                return {
                    template: require('components/ows/partials/dialog_getcapabilities_error.html'),
                    link: function(scope, element, attrs) {
                        scope.capabilitiesErrorModalVisible = true;
                    }
                };
            }])

        /**
         * @name hs.ows.wfs.service_capabilities
         * @ngdoc service
         * @memberOf hs.ows.wfs
         * @description Service for GetCapabilities requests to WFS
         */
        .service("hs.ows.wfs.service_capabilities", ['$http', 'hs.map.service', 'hs.utils.service', '$rootScope',
            function($http, OlMap, utils, $rootScope) {
                var me = this;

                /**
                * Get WFS service location without parameters from url string
                * @memberof hs.ows.wfs.service_capabilities
                * @function getPathFromUrl
                * @param {String} str Url string to parse
                * @returns {String} WFS service Url without params
                */
                this.getPathFromUrl = function(str) {
                    if (str.indexOf('?') > -1)
                        return str.substring(0, str.indexOf("?"));
                    else
                        return str;
                };

                /**
                * Create WFS parameter string from parameter object 
                * @memberof hs.ows.wfs.service_capabilities
                * @function param2String
                * @param {Object} obj Object with stored WFS service parameters
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
                * Parse added service url and sends request GetCapabalities to WFS service
                * @memberof hs.ows.wfs.service_capabilities
                * @function requestGetCapabilities
                * @param {String} service_url Raw Url localization of service
                * @returns {Promise} Promise object -  Response to GetCapabalities request
                */
                this.requestGetCapabilities = function(service_url) {
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
                    var promise = $http.get(url);
                    promise.then(function(r) {
                        $rootScope.$broadcast('ows_wfs.capabilities_received', r)
                    });
                    return promise;
                };

                /**
                * Test if current map projection is in supported projection list
                * @memberof hs.ows.wfs.service_capabilities
                * @function currentProjectionSupported
                * @param {Array} srss List of supported projections
                * @returns {Boolean} True if map projection is in list, otherwise false
                */
                this.currentProjectionSupported = function(srss) {
                    var found = false;
                    angular.forEach(srss, function(val) {
                        if (val.toUpperCase().indexOf(OlMap.map.getView().getProjection().getCode().toUpperCase().replace('EPSG:', 'EPSG::')) > -1) found = true;
                    })
                    return found;
                }

                /**
                * (DEPRECATED ?)
                * @memberof hs.ows.wfs.service_capabilities
                * @function getUrl
                * @param {} url
                * @param {} use_proxy
                */
                this.getUrl = function(url, use_proxy) {
                    if (typeof use_proxy == 'undefined' || !use_proxy) return url;
                    else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=WMS';
                }
            }
        ])

        /**
         * @name hs.ows.wfs.controller
         * @ngdoc controller
         * @memberOf hs.ows.wfs
         * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
         */
        .controller('hs.ows.wfs.controller', ['$scope', 'hs.map.service', 'hs.ows.wfs.service_capabilities', 'Core', '$compile', '$rootScope',
            function($scope, OlMap, srv_caps, Core, $compile, $rootScope) {
                $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                $scope.$on('ows_wfs.capabilities_received', function(event, response) {
                    try {
                        caps = new WFSCapabilities(response.data);
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
                        var previousDialog = document.getElementById("ows-wfs-capabilities-error");
                        if(previousDialog)
                            previousDialog.parentNode.removeChild(previousDialog);
                        var el = angular.element('<div hs.ows.wfs.capabilities_error_directive></span>');
                        $compile(el)($scope);
                        document.getElementById("hs-dialog-area").appendChild(el[0]);
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
                 * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
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
                 * @param {boolean} checked - Add all available layers or olny checked ones. Checked=false=all
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
                 * @param {String} outputFormat
                 * @param {OpenLayers.Projection} srs of the layer
                 * (PRIVATE) Add selected layer to map???
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

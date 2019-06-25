/**
 * @namespace hs.ows
 * @memberOf hs
 */

define(['angular', 'map', 'ows_wms', 'ows_wmts', 'ows_wfs', 'ows_nonwms', 'permalink'],

    function(angular) {
        var ows = angular.module('hs.ows', ['hs.map', 'hs.ows.wms', 'hs.ows.wmts', 'hs.ows.nonwms'])
            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name hs.ows.directive
            * @description Add core ows panel html template to the map (Select source format and connect to source)
            */
            .directive('hs.ows.directive', ['config', function(config) {
                return {
                    template: require('components/ows/partials/ows.html')
                };
            }])
            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name hs.ows.wms
            * @description  Directive for configurating wms layer to add
            */
           .directive('hs.ows.wms', ['config', function(config) {
                return {
                    template: config.design == 'md' ? require('components/ows/partials/owswmsmd.html') : require('components/ows/partials/owswms.html')
                };
            }])

            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name hs.ows.wfs
            * @description Directive for configurating wfs layer to add
            */
           .directive('hs.ows.wfs', ['config', function(config) {
                return {
                    template: require('components/ows/partials/owswfs.html')
                };
            }])

            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name hs.ows.wmts
            * @description Directive for configurating wmts layer to add
            */
           .directive('hs.ows.wmts', ['config', function(config) {
                return {
                    template: require('components/ows/partials/owswms.html')
                };
            }])

            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name hs.ows.nonwms
            * @description TODO
            */
           .directive('hs.ows.nonwms', ['config', function(config) {
                return {
                    template: require('components/ows/partials/owsnonwms.html')
                };
            }])
            
            /**
            * @memberof hs.ows
            * @ngdoc directive
            * @name compile
            * @description Directive which compiles a template and includes it in the dome. 
            * Previously done with ng-bind-html which escaped varaiables and child directives
            */
            .directive('compile', ['$compile', function ($compile) {
                    return function(scope, element, attrs) {
                        scope.$watch(
                        function(scope) {
                            // watch the 'compile' expression for changes
                            return scope.$eval(attrs.compile);
                        },
                        function(value) {
                            // when the 'compile' expression changes
                            // assign it into the current DOM
                            element.html(value);
            
                            // compile the new DOM and link it to the current
                            // scope.
                            // NOTE: we only compile .childNodes so that
                            // we don't get into infinite loop compiling ourselves
                            $compile(element.contents())(scope);
                        }
                    );
                };
            }])

            /**
            * @memberof hs.ows
            * @ngdoc controller
            * @name hs.ows.controller
            */
            .controller('hs.ows.controller', ['$scope', '$injector', 'hs.ows.wms.service_capabilities', 'hs.ows.wmts.service_capabilities', 'hs.map.service', 'hs.permalink.urlService', 'Core', 'hs.ows.nonwms.service', 'config', '$rootScope',
                function($scope, $injector, srv_wms_caps, srv_wmts_caps, OlMap, permalink, Core, nonwmsservice, config, $rootScope) {
                    var map = OlMap.map;
                    if (window.allowWFS2) {
                        srv_wfs_caps = $injector.get('hs.ows.wfs.service_capabilities');
                    }
                    if (angular.isArray(config.connectTypes)) {
                        $scope.types = config.connectTypes;
                    } else {
                        $scope.types = ["", "WMS", "KML", "GeoJSON"];
                    }
                    $scope.type = "";
                    $scope.image_formats = [];
                    $scope.query_formats = [];
                    $scope.tile_size = 512;
                    /**
                    * Connect to service of specified Url and Type
                    * @memberof hs.ows.controller
                    * @function setUrlAndConnect
                    * @param {String} url Url of requested service
                    * @param {String} type Type of requested service
                    */
                    $scope.setUrlAndConnect = function(url, type) {
                        $scope.url = url;
                        $scope.type = type;
                        $scope.connect();
                    }
                    /**
                    * Get capabalitires of selected OGC service and show details in app
                    * @memberof hs.ows.controller
                    * @function connect
                    */
                    $scope.connect = function() {
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                srv_wms_caps.requestGetCapabilities($scope.url);
                                $scope.showDetails = true;
                                break;
                            case "wmts":
                                srv_wmts_caps.requestGetCapabilities($scope.url);
                                $scope.showDetails = true;
                                break;
                            case "wfs":
                                if (window.allowWFS2) {
                                    srv_wfs_caps.requestGetCapabilities($scope.url);
                                    $scope.showDetails = true;
                                }
                                break;
                        }
                    };
                    
                    /**
                    * Change detail panel template according to selected type
                    * @memberof hs.ows.controller
                    * @function templateByType
                    * @return {String} template Path to correct type template
                    */
                    /**TODO: move variables out of this function. Call $scope.connected = false when template change */
                    $scope.templateByType = function() {
                        var template;
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                template = '<div hs.ows.wms></div>';
                                break;
                            case "wmts":
                                template = '<div hs.ows.wmts></div>';
                                break;
                            case "wms with priorities":
                                template = require(`${ows_path}owsprioritized${config.design || ''}.html`);
                                break;
                            case "wfs":
                                template = '<div hs.ows.wfs></div>';
                                break;
                            case "kml":
                            case "geojson":
                                template = '<div hs.ows.nonwms></div>';
                                $scope.showDetails = true;
                                break;
                            default:
                                break;
                        }
                        return template;
                    };

                    /**
                    * Test if currently selected type is service or file
                    * @memberof hs.ows.controller
                    * @function isService
                    * @returns {Boolean} boolean True for service, false for file
                    */
                    $scope.isService = function() {
                        if (["kml", "geojson", "json"].indexOf($scope.type.toLowerCase()) > -1) {
                            return false;
                        } else {
                            return true;
                        }
                    }

                    /**
                    * Clear Url and hide details
                    * @memberof hs.ows.controller
                    * @function clear
                    */
                    $scope.clear = function() {
                        $scope.url = '';
                        $scope.showDetails = false;
                    }

                    /**
                    * (PRIVATE) Zoom to selected vector layer
                    * @memberof hs.ows.controller
                    * @function zoomToVectorLayer
                    * @param {ol.Layer} lyr New layer
                    */
                    function zoomToVectorLayer(lyr) {
                        Core.setMainPanel('layermanager');
                        lyr.getSource().on('change', function() { //Event needed because features are loaded asynchronously
                            var extent = lyr.getSource().getExtent();
                            if (extent != null) map.getView().fit(extent, map.getSize());
                        });
                    }

                    if (permalink.getParamValue('wms_to_connect')) {
                        var wms = permalink.getParamValue('wms_to_connect');
                        Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                        $scope.setUrlAndConnect(wms, 'WMS');
                        $rootScope.$broadcast('ows.wms_connecting');
                    }

                    if (permalink.getParamValue('wfs_to_connect') && window.allowWFS2) {
                        var wfs = permalink.getParamValue('wfs_to_connect');
                        Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                        $scope.setUrlAndConnect(wfs, 'WFS');
                        if (Core.singleDatasources) $('.dss-tabs a[href="#OWS"]').tab('show');
                    }

                    var title = decodeURIComponent(permalink.getParamValue('title')) || 'Layer';
                    var abstract = decodeURIComponent(permalink.getParamValue('abstract'));

                    if (permalink.getParamValue('geojson_to_connect')) {
                        var url = permalink.getParamValue('geojson_to_connect');
                        var type = 'geojson';
                        if(url.indexOf('gpx')>0) type='gpx';
                        if(url.indexOf('kml')>0) type='kml';
                        var lyr = nonwmsservice.add(type, url, title, abstract, false, 'EPSG:4326');
                        zoomToVectorLayer(lyr);
                    }

                    if (permalink.getParamValue('kml_to_connect')) {
                        var url = permalink.getParamValue('kml_to_connect');
                        var lyr = nonwmsservice.add('kml', url, title, abstract, true, 'EPSG:4326');
                        zoomToVectorLayer(lyr);
                    }



                    $scope.$emit('scope_loaded', "Ows");
                }
            ]);
        if (window.allowWFS2) {//TODO should not use global variables
            ows.requires.push('hs.ows.wfs');
        }
    })

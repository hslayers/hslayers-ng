/**
 * @namespace hs.search
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'permalink', 'styles'],

    function(angular, ol) {
        angular.module('hs.search', ['hs.map', 'hs.styles'])
            /**
             * @memberof hs.search
             * @ngdoc directive
             * @name hs.search.directiveSearchinput
             * @description Add search input template to page, with automatic change event and clear button
             */
            .directive('hs.search.directiveSearchinput', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchinput.html?bust=' + gitsha,
                    replace: true,
                    link: function(scope, element) {

                    }
                };
                /**
                 * @memberof hs.search
                 * @ngdoc directive
                 * @name hs.search.directiveSearchresults
                 * @description Add search results template to page
                 */
            }]).directive('hs.search.directiveSearchresults', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchresults.html?bust=' + gitsha,
                    replace: true,
                    link: function(scope, element) {

                    }
                };
                /**
                 * @memberof hs.search
                 * @ngdoc service
                 * @name hs.search.service
                 * @description Provides geolocation search request from site selected in config (geonames/sdi4apps) and pass response to handler on success
                 */
            }]).service('hs.search.service', ['$http', 'hs.utils.service', 'config',
                function($http, utils, config) {
                    this.xhr = {};
                    /**
                     * Send geolocation request to Geolocation server
                     * @memberof hs.search.controller
                     * @function request
                     * @params {String} query 
                     */
                    this.request = function(query) {
                        var url = null;
                        var providers = [];
                        
                        if (angular.isUndefined(config.search_provider))
                            providers = ['geonames'];
                        else if(typeof config.search_provider == 'string')
                            providers = [config.search_provider]
                        else if(angular.isObject(config.search_provider)) 
                            providers = config.search_provider;
                        
                        angular.forEach(providers, function(provider){
                            if (provider == 'geonames') {
                                url = "http://api.geonames.org/searchJSON?&username=raitis&name_startsWith=" + query;
                            } else if (provider == 'sdi4apps_openapi') {
                                url = "http://portal.sdi4apps.eu/openapi/search?q=" + query;
                            }
                            url = utils.proxify(url);
                            if (angular.isDefined(me.xhr[provider]) && me.xhr[provider] !== null) me.xhr[provider].abort();
                            me.xhr[provider] = $.ajax({
                                url: url,
                                cache: false,
                                provider: provider,
                                success: function(r) {
                                    me.searchResultsReceived(r, this.provider);
                                    me.xhr[this.provider] = null
                                }
                            });
                        })
                    };
                    var me = this;
                }
            ])
            /**
             * @memberof hs.search
             * @ngdoc controller
             * @name hs.search.controller
             */
            .controller('hs.search.controller', ['$scope', 'Core', 'hs.map.service', 'hs.search.service', '$log', 'hs.permalink.service_url', 'hs.styles.service', 'config', '$rootScope',
                function($scope, Core, OlMap, SearchService, $log, permalink, styles, config, $rootScope) {
                    var map;
                    var point_clicked = new ol.geom.Point([0, 0]);
                    var format = new ol.format.WKT();
                    $scope.providers = {};
                    
                    if (angular.isDefined(OlMap.map))
                        map = OlMap.map;
                    else
                        $scope.$on('map.loaded', function(){
                            map = OlMap.map;
                        });

                    $scope.search_results_layer = null;

                    /**
                     * Initialization of search state
                     * @memberof hs.search.controller
                     * @function init 
                     */
                    $scope.init = function() {
                        $scope.query = "";
                        $scope.results = [];
                        $scope.clearvisible = false;
                        if (permalink.getParamValue('search')) {
                            $scope.query = permalink.getParamValue('search');
                            Core.searchVisible(true);
                            $scope.queryChanged();
                        }
                    }

                    /**
                     * Handler of search input, request search service and display results div
                     * @memberof hs.search.controller
                     * @function queryChanged 
                     */
                    $scope.queryChanged = function() {
                        SearchService.request($scope.query);
                        $("#searchresults").show();
                    }

                    /**
                     * Zoom map to selected result from results list
                     * @memberof hs.search.controller
                     * @function zoomTo 
                     * @param {object} result Selected result 
                     */
                    $scope.zoomTo = function(result) {
                        $scope.fcode_zoom_map = {
                            'PPLA': 12,
                            'PPL': 15,
                            'PPLC': 10,
                            "ADM1": 9,
                            'FRM': 15,
                            'PPLF': 13,
                            'LCTY': 13,
                            'RSTN': 15,
                            "PPLA3": 9,
                            'AIRP': 13,
                            'AIRF': 13,
                            'HTL': 17,
                            'STM': 14,
                            'LK': 13
                        };
                        $scope.createCurrentPointLayer();
                        if (result.provider_name == 'geonames') {
                            coordinate = ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', map.getView().getProjection());
                        } else if (result.provider_name == 'sdi4apps_openapi') {
                            var g_feature = format.readFeature(result.FullGeom.toUpperCase());
                            coordinate = (g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection())).getCoordinates();
                        }
                        point_clicked.setCoordinates(coordinate, 'XY');
                        map.getView().setCenter(coordinate);
                        var zoom_level = 10;
                        if (angular.isDefined(result.fcode) && angular.isDefined($scope.fcode_zoom_map[result.fcode])) {
                            zoom_level = $scope.fcode_zoom_map[result.fcode];
                        } 
                        map.getView().setZoom(zoom_level);
                        $rootScope.$broadcast('search.zoom_to_center', {coordinate: ol.proj.transform(coordinate, map.getView().getProjection(), 'EPSG:4326'), zoom: zoom_level});
                        $scope.clear();
                    }

                    /**
                     * Remove previous search and search results
                     * @memberof hs.search.controller
                     * @function clear 
                     */
                    $scope.clear = function() {
                        angular.forEach($scope.providers, function(provider){
                            provider.results = [];
                        });
                        $scope.query = '';
                        $scope.clearvisible = false;
                        if ($scope.search_results_layer) map.getLayers().remove($scope.search_results_layer);
                        $scope.search_results_layer = null;
                    }

                    /**
                     * Handler for receiving results of search request, sends results to correct parser
                     * @memberof hs.search.controller
                     * @function searchResultsReceived
                     * @param {object} response Result of search request
                     * @param {string} provider Which provider sent the search results
                     */
                    SearchService.searchResultsReceived = function(response, provider_name) {
                        $("#searchresults").show();
                        $scope.clearvisible = true;
                        $scope.createCurrentPointLayer();
                        if (angular.isUndefined($scope.providers[provider_name]))
                            $scope.providers[provider_name] = {results: [], name: provider_name};
                        provider = $scope.providers[provider_name];
                        if (provider_name == 'geonames') {
                            parseGeonamesResults(response, provider);
                        } else if (provider_name == 'sdi4apps_openapi') {
                            parseOpenApiResults(response, provider);
                        }
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    /**
                     * Result parser of results from Geonames service
                     * @memberof hs.search.controller
                     * @function parseGeonamesResults
                     * @param {object} response Result of search request
                     * @param {object} provider Which provider sent the search results
                     */
                    function parseGeonamesResults(response, provider) {
                        provider.results = response.geonames;
                        generateGeonamesFeatures(provider);
                    }
                    
                    function generateGeonamesFeatures(provider){
                        var src = $scope.search_results_layer.getSource();
                        angular.forEach(provider.results, function(result) {
                            result.provider_name = provider.name;
                            var feature = new ol.Feature({
                                geometry: new ol.geom.Point(ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', map.getView().getProjection())),
                                record: result
                            });
                            src.addFeature(feature);
                            result.feature = feature;
                        });
                    }

                    /**
                     * Result parser of results from OpenApi service
                     * @memberof hs.search.controller
                     * @function parseOpenApiResults
                     * @param {object} response Result of search request
                     * @param {object} provider Which provider sent the search results
                     */
                    function parseOpenApiResults(response, provider) {
                        provider.results = response.data;
                        generateOpenApiFeatures(provider);
                    }
                    
                    function generateOpenApiFeatures(provider){
                        angular.forEach(provider.results, function(result) {
                            var g_feature = format.readFeature(result.FullGeom.toUpperCase());
                            var src = $scope.search_results_layer.getSource();
                            result.provider_name = provider.name;
                            var feature = new ol.Feature({
                                geometry: g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection()),
                                record: result
                            });
                            src.addFeature(feature);
                            result.feature = feature;
                        });
                    }

                    /**
                     * Add search results layer to map and clean old results if exist
                     * @memberof hs.search.controller
                     * @function createCurrentPointLayer
                     */
                    $scope.createCurrentPointLayer = function() {
                        if ($scope.search_results_layer) {
                            $scope.search_results_layer.getSource().clear();
                            map.removeLayer($scope.search_results_layer);
                        }
                        $scope.search_results_layer = new ol.layer.Vector({
                            title: "Search results",
                            source: new ol.source.Vector({}),
                            style: styles.pin_white_blue_highlight,
                            show_in_manager: false
                        });
                        angular.forEach($scope.providers, function(provider){
                            if (provider.name == 'geonames') {
                                generateGeonamesFeatures(provider);
                            } else if (provider.name == 'sdi4apps_openapi') {
                                generateOpenApiFeatures(provider);
                            }
                        });
                        map.addLayer($scope.search_results_layer);
                    }

                    /**
                     * Set property highlighted of result to state
                     * @memberof hs.search.controller
                     * @function highlightResult
                     * @param {object} result
                     * @param {string} state
                     */
                    $scope.highlightResult = function(result, state) {
                        if (angular.isDefined(result.feature))
                            result.feature.set('highlighted', state)
                    }
                    $scope.init();

                    $scope.$on('search.results_received', function(e, r) {
                        $scope.searchResultsReceived(r);
                    });
                    $scope.$watch('Core.panelVisible("search")', function(newValue, oldValue) {
                        if (newValue !== oldValue && newValue) {
                            setTimeout(function() {
                                $('#search_address').focus();
                            }, 500);
                        }
                    });
                    $scope.$emit('scope_loaded', "Search");
                }
            ]);
    })

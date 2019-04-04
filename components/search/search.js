/**
 * @namespace hs.search
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'permalink', 'styles'],

    function (angular, ol) {
        angular.module('hs.search', ['hs.map', 'hs.styles'])
            /**
             * @memberof hs.search
             * @ngdoc directive
             * @name hs.search.directiveSearchinput
             * @description Add search input template to page, with automatic change event and clear button
             */
            .directive('hs.search.directiveSearchinput', ['config', function (config) {
                return {
                    templateUrl: config.hsl_path + 'components/search/partials/searchinput.html',
                    replace: true,
                    link: function (scope, element) {

                    }
                };
                /**
                 * @memberof hs.search
                 * @ngdoc directive
                 * @name hs.search.directiveSearchresults
                 * @description Add search results template to page
                 */
            }]).directive('hs.search.directiveSearchresults', ['config', function (config) {
                return {
                    templateUrl: config.hsl_path + 'components/search/partials/searchresults.html?bust=',
                    replace: true,
                    link: function (scope, element) {

                    }
                };
                /**
                 * @memberof hs.search
                 * @ngdoc service
                 * @name hs.search.service
                 * @description Provides geolocation search request from site selected in config (geonames/sdi4apps) and pass response to handler on success
                 */
            }]).service('hs.search.service', ['$http', '$q', 'hs.utils.service', 'config', 'hs.map.service', 'hs.styles.service', '$rootScope',
                function ($http, $q, utils, config, OlMap, Styles, $rootScope) {
                    this.data = {};

                    this.data.providers = {};

                    var formatWKT = new ol.format.WKT();

                    this.searchResultsLayer = new ol.layer.Vector({
                        title: "Search results",
                        source: new ol.source.Vector({}),
                        style: Styles.pin_white_blue_highlight,
                        show_in_manager: false
                    });

                    this.canceler = {};
                    var me = this;
                    /**
                     * @memberof hs.search.service
                     * @function request
                     * @public
                     * @params {String} query 
                     * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
                     */
                    this.request = function (query) {
                        var url = null;
                        var providers = [];

                        if (angular.isUndefined(config.search_provider))
                            providers = ['geonames'];
                        else if (typeof config.search_provider == 'string')
                            providers = [config.search_provider]
                        else if (angular.isObject(config.search_provider))
                            providers = config.search_provider;
                        me.cleanResults();
                        angular.forEach(providers, function (provider) {
                            if (provider == 'geonames') {
                                url = "http://api.geonames.org/searchJSON?&username=raitis&name_startsWith=" + query;
                            } else if (provider == 'sdi4apps_openapi') {
                                url = "http://portal.sdi4apps.eu/openapi/search?q=" + query;
                            }
                            //url = utils.proxify(url);
                            if (angular.isDefined(me.canceler[provider])) {
                                me.canceler[provider].resolve();
                                delete me.canceler[provider];
                            }
                            me.canceler[provider] = $q.defer();

                            $http.get(url, { timeout: me.canceler[provider].promise }).then(function (response) {
                                me.searchResultsReceived(response.data, provider);
                            }, function (err) { })
                        })
                    };
                    /**
                     * @memberof hs.search.service
                     * @function searchResultsReceived
                     * @public
                     * @params {Object} response Response object of Geolocation request
                     * @params {String} providerName Name of request provider 
                     * @description Maintain inner results object and parse response with correct provider parser
                     */
                    this.searchResultsReceived = function (response, providerName) {
                        if (angular.isUndefined(me.data.providers[providerName]))
                            me.data.providers[providerName] = { results: [], name: providerName };
                        provider = me.data.providers[providerName];
                        if (providerName == 'geonames') {
                            parseGeonamesResults(response, provider);
                        } else if (providerName == 'sdi4apps_openapi') {
                            parseOpenApiResults(response, provider);
                        }
                        $rootScope.$broadcast('search.resultsReceived', { layer: me.searchResultsLayer, providers: me.data.providers });
                    }
                    /**
                     * @memberof hs.search.service
                     * @function hideResultsLayer
                     * @public
                     * @description Remove results layer from map
                     */
                    this.hideResultsLayer = function () {
                        OlMap.map.removeLayer(me.searchResultsLayer);
                    }
                    /**
                     * @memberof hs.search.service
                     * @function showResultsLayer
                     * @public
                     * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
                     */
                    this.showResultsLayer = function () {
                        me.hideResultsLayer();
                        OlMap.map.addLayer(me.searchResultsLayer);
                    }
                    /**
                     * @memberof hs.search.service
                     * @function cleanResults
                     * @public
                     * @description Clean all search results from results variable and results layer
                     */
                    this.cleanResults = function () {
                        angular.forEach(me.data.providers, function (provider) {
                            if (angular.isDefined(provider.results)) provider.results.length = 0;
                        });
                        me.searchResultsLayer.getSource().clear();
                        me.hideResultsLayer();
                    }
                    /**
                     * @memberof hs.search.service
                     * @function selectResult
                     * @public
                     * @params {Object} result Entity of selected result 
                     * @params {String} zoomLevel Zoom level to zoom on
                     * @description Move map and zoom on selected search result
                     */
                    this.selectResult = function (result, zoomLevel) {
                        var coordinate = getResultCoordinate(result);
                        OlMap.map.getView().setCenter(coordinate);
                        if (angular.isUndefined(zoomLevel)) zoomLevel = 10;
                        OlMap.map.getView().setZoom(zoomLevel);
                        $rootScope.$broadcast('search.zoom_to_center', { coordinate: ol.proj.transform(coordinate, OlMap.map.getView().getProjection(), 'EPSG:4326'), zoom: zoomLevel });
                    }
                    /**
                     * @memberof hs.search.service
                     * @function getResultCoordinate
                     * @public
                     * @params {Object} result Entity of selected result 
                     * @return {Object} Ol.coordinate of selected result
                     * @description Parse coordinate of selected result
                     */
                    function getResultCoordinate(result) {
                        if (result.provider_name == 'geonames') {
                            return ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', OlMap.map.getView().getProjection());
                        } else if (result.provider_name == 'sdi4apps_openapi') {
                            var g_feature = formatWKT.readFeature(result.FullGeom.toUpperCase());
                            return (g_feature.getGeometry().transform('EPSG:4326', OlMap.map.getView().getProjection())).getCoordinates();
                        }
                    }

                    /**
                     * @memberof hs.search.service
                     * @function parseGeonamesResults
                     * @private
                     * @param {object} response Result of search request
                     * @param {object} provider Which provider sent the search results
                     * @description Result parser of results from Geonames service
                     */
                    function parseGeonamesResults(response, provider) {
                        provider.results = response.geonames;
                        generateGeonamesFeatures(provider);
                    }
                    function generateGeonamesFeatures(provider) {
                        var src = me.searchResultsLayer.getSource();
                        angular.forEach(provider.results, function (result) {
                            result.provider_name = provider.name;
                            var feature = new ol.Feature({
                                geometry: new ol.geom.Point(getResultCoordinate(result)),
                                record: result
                            });
                            src.addFeature(feature);
                            result.feature = feature;
                        });
                    }

                    /**
                     * @memberof hs.search.service
                     * @function parseOpenApiResults
                     * @private
                     * @param {object} response Result of search request
                     * @param {object} provider Which provider sent the search results
                     * @description Result parser of results from OpenApi service
                     */
                    function parseOpenApiResults(response, provider) {
                        provider.results = response.data;
                        generateOpenApiFeatures(provider);
                    }
                    function generateOpenApiFeatures(provider) {
                        var src = me.searchResultsLayer.getSource();
                        angular.forEach(provider.results, function (result) {
                            var g_feature = formatWKT.readFeature(result.FullGeom.toUpperCase());
                            result.provider_name = provider.name;
                            var feature = new ol.Feature({
                                geometry: new ol.geom.Point(getResultCoordinate(result)),
                                record: result
                            });
                            src.addFeature(feature);
                            result.feature = feature;
                        });
                    }

                    var me = this;
                }
            ])
            /**
             * @memberof hs.search
             * @ngdoc controller
             * @name hs.search.controller
             */
            .controller('hs.search.controller', ['$scope', 'Core', 'hs.search.service', 'hs.permalink.urlService',
                function ($scope, Core, SearchService, permalink) {
                    $scope.data = SearchService.data;

                    /**
                     * Initialization of search state
                     * @memberof hs.search.controller
                     * @function init 
                     */
                    $scope.init = function () {
                        $scope.query = "";
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
                    $scope.queryChanged = function () {
                        SearchService.request($scope.query);
                    }

                    /**
                     * Zoom map to selected result from results list
                     * @memberof hs.search.controller
                     * @function zoomTo 
                     * @param {object} result Selected result 
                     */
                    $scope.zoomTo = function (result) {
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
                        var zoom_level = 10;
                        if (angular.isDefined(result.fcode) && angular.isDefined($scope.fcode_zoom_map[result.fcode])) {
                            zoom_level = $scope.fcode_zoom_map[result.fcode];
                        }
                        SearchService.selectResult(result, zoom_level);
                        $scope.clear();
                    }

                    /**
                     * Remove previous search and search results
                     * @memberof hs.search.controller
                     * @function clear 
                     */
                    $scope.clear = function () {
                        $scope.query = '';
                        $scope.clearvisible = false;
                        SearchService.cleanResults();
                    }

                    /**
                     * Handler for receiving results of search request, sends results to correct parser
                     * @memberof hs.search.controller
                     * @function searchResultsReceived
                     * @param {object} response Result of search request
                     * @param {string} provider Which provider sent the search results
                     */
                    $scope.searchResultsReceived = function (r) {
                        $scope.searchResultsVisible = true;
                        $scope.clearvisible = true;
                        SearchService.showResultsLayer();
                    }

                    /**
                     * Set property highlighted of result to state
                     * @memberof hs.search.controller
                     * @function highlightResult
                     * @param {object} result
                     * @param {string} state
                     */
                    $scope.highlightResult = function (result, state) {
                        if (angular.isDefined(result.feature))
                            result.feature.set('highlighted', state)
                    }
                    $scope.init();

                    $scope.$on('search.resultsReceived', function (e, r) {
                        $scope.searchResultsReceived(r);
                    });

                    $scope.$watch('Core.panelVisible("search")', function (newValue, oldValue) {
                        if (newValue !== oldValue && newValue) {
                            setTimeout(function () {
                                $('#search_address').focus();
                            }, 500);
                        }
                    });
                    $scope.$emit('scope_loaded', "Search");
                }
            ]);
    })

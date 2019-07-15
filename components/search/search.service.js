import { WKT } from 'ol/format';
import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import Feature from 'ol/Feature';
import {Point} from 'ol/geom';
import {transform} from 'ol/proj';

export default ['$http', '$q', 'hs.utils.service', 'config', 'hs.map.service', 'hs.styles.service', '$rootScope',
    function ($http, $q, utils, config, OlMap, Styles, $rootScope) {
        this.data = {};

        this.data.providers = {};

        var formatWKT = new WKT();

        this.searchResultsLayer = new VectorLayer({
            title: "Search results",
            source: new Vector({}),
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
                    if (location.protocol == 'https:') url = utils.proxify(url);
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
            var provider = me.data.providers[providerName];
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
            $rootScope.$broadcast('search.zoom_to_center', { coordinate: transform(coordinate, OlMap.map.getView().getProjection(), 'EPSG:4326'), zoom: zoomLevel });
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
                return transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', OlMap.map.getView().getProjection());
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
                var feature = new Feature({
                    geometry: new Point(getResultCoordinate(result)),
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
                var feature = new Feature({
                    geometry: new Point(getResultCoordinate(result)),
                    record: result
                });
                src.addFeature(feature);
                result.feature = feature;
            });
        }

        var me = this;
    }
]
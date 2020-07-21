import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {WKT} from 'ol/format';
import {transform} from 'ol/proj';

/**
 * @param $http
 * @param $q
 * @param HsUtilsService
 * @param HsConfig
 * @param HsMapService
 * @param HsStylesService
 * @param $rootScope
 */
export default function (
  $http,
  $q,
  HsUtilsService,
  HsConfig,
  HsMapService,
  HsStylesService,
  $rootScope,
  HsEventBusService
) {
  'ngInject';
  const me = this;
  this.data = {};

  this.data.providers = {};

  const formatWKT = new WKT();

  this.searchResultsLayer = new VectorLayer({
    title: 'Search results',
    source: new Vector({}),
    style: HsStylesService.pin_white_blue_highlight,
    show_in_manager: false,
  });

  this.canceler = {};
  /**
   * @memberof HsSearchService
   * @function request
   * @public
   * @param {string} query Place name or part of it
   * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  this.request = function (query) {
    let url = null;
    let providers = [];
    if (
      angular.isDefined(HsConfig.search_provider) &&
      angular.isUndefined(HsConfig.searchProvider)
    ) {
      HsConfig.searchProvider = HsConfig.search_provider;
    }

    if (angular.isUndefined(HsConfig.searchProvider)) {
      providers = ['geonames'];
    } else if (
      typeof HsConfig.searchProvider == 'string' ||
      angular.isFunction(HsConfig.searchProvider)
    ) {
      providers = [HsConfig.searchProvider];
    } else if (angular.isObject(HsConfig.searchProvider)) {
      providers = HsConfig.searchProvider;
    }
    me.cleanResults();
    angular.forEach(providers, (provider) => {
      let providerId = provider;
      if (provider == 'geonames') {
        if (angular.isDefined(HsConfig.geonamesUser)) {
          url = `http://api.geonames.org/searchJSON?&name_startsWith=${query}&username=${HsConfig.geonamesUser}`;
        } else {
          //Username will have to be set in proxy
          url = HsUtilsService.proxify(
            `http://api.geonames.org/searchJSON?&name_startsWith=${query}`
          );
        }
        if (location.protocol == 'https:') {
          url = HsUtilsService.proxify(url);
        }
      } else if (provider == 'sdi4apps_openapi') {
        url = 'http://portal.sdi4apps.eu/openapi/search?q=' + query;
      } else if (angular.isFunction(provider)) {
        url = provider(query);
        if (provider.name == 'searchProvider') {
          //Anonymous function?
          providerId = 'geonames';
        } else {
          providerId = provider.name;
        }
      }
      //url = utils.proxify(url);
      if (angular.isDefined(me.canceler[providerId])) {
        me.canceler[providerId].resolve();
        delete me.canceler[providerId];
      }
      me.canceler[providerId] = $q.defer();

      $http.get(url, {timeout: me.canceler[providerId].promise}).then(
        (response) => {
          me.searchResultsReceived(response.data, providerId);
        },
        (err) => {}
      );
    });
  };
  /**
   * @memberof HsSearchService
   * @function searchResultsReceived
   * @public
   * @param {object} response Response object of Geolocation request
   * @param {string} providerName Name of request provider
   * @description Maintain inner results object and parse response with correct provider parser
   */
  this.searchResultsReceived = function (response, providerName) {
    if (angular.isUndefined(me.data.providers[providerName])) {
      me.data.providers[providerName] = {results: [], name: providerName};
    }
    const provider = me.data.providers[providerName];
    if (providerName.indexOf('geonames') > -1) {
      parseGeonamesResults(response, provider);
    } else if (providerName == 'sdi4apps_openapi') {
      parseOpenApiResults(response, provider);
    } else {
      parseGeonamesResults(response, provider);
    }
    $rootScope.$broadcast('search.resultsReceived', {
      layer: me.searchResultsLayer,
      providers: me.data.providers,
    });
  };
  /**
   * @memberof HsSearchService
   * @function hideResultsLayer
   * @public
   * @description Remove results layer from map
   */
  this.hideResultsLayer = function () {
    HsMapService.map.removeLayer(me.searchResultsLayer);
  };
  /**
   * @memberof HsSearchService
   * @function showResultsLayer
   * @public
   * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  this.showResultsLayer = function () {
    me.hideResultsLayer();
    HsMapService.map.addLayer(me.searchResultsLayer);
  };
  /**
   * @memberof HsSearchService
   * @function cleanResults
   * @public
   * @description Clean all search results from results variable and results layer
   */
  this.cleanResults = function () {
    angular.forEach(me.data.providers, (provider) => {
      if (angular.isDefined(provider.results)) {
        provider.results.length = 0;
      }
    });
    me.searchResultsLayer.getSource().clear();
    me.hideResultsLayer();
  };
  /**
   * @memberof HsSearchService
   * @function selectResult
   * @public
   * @param {object} result Entity of selected result
   * @param {string} zoomLevel Zoom level to zoom on
   * @description Move map and zoom on selected search result
   */
  this.selectResult = function (result, zoomLevel) {
    const coordinate = getResultCoordinate(result);
    HsMapService.map.getView().setCenter(coordinate);
    if (angular.isUndefined(zoomLevel)) {
      zoomLevel = 10;
    }
    HsMapService.map.getView().setZoom(zoomLevel);
    HsEventBusService.searchZoomTo.next({
      coordinate: transform(
        coordinate,
        HsMapService.map.getView().getProjection(),
        'EPSG:4326'
      ),
      zoom: zoomLevel,
    });
  };
  /**
   * @memberof HsSearchService
   * @function getResultCoordinate
   * @public
   * @param {object} result Entity of selected result
   * @returns {object} Ol.coordinate of selected result
   * @description Parse coordinate of selected result
   */
  function getResultCoordinate(result) {
    if (
      result.provider_name.indexOf('geonames') > -1 ||
      result.provider_name == 'searchFunctionsearchProvider'
    ) {
      return transform(
        [parseFloat(result.lng), parseFloat(result.lat)],
        'EPSG:4326',
        HsMapService.map.getView().getProjection()
      );
    } else if (result.provider_name == 'sdi4apps_openapi') {
      const g_feature = formatWKT.readFeature(result.FullGeom.toUpperCase());
      return g_feature
        .getGeometry()
        .transform('EPSG:4326', HsMapService.map.getView().getProjection())
        .getCoordinates();
    }
  }

  /**
   * @memberof HsSearchService
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
  /**
   * @param provider
   */
  function generateGeonamesFeatures(provider) {
    const src = me.searchResultsLayer.getSource();
    angular.forEach(provider.results, (result) => {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(getResultCoordinate(result)),
        record: result,
      });
      src.addFeature(feature);
      result.feature = feature;
    });
  }

  /**
   * @memberof HsSearchService
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
  /**
   * @param provider
   */
  function generateOpenApiFeatures(provider) {
    const src = me.searchResultsLayer.getSource();
    angular.forEach(provider.results, (result) => {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(getResultCoordinate(result)),
        record: result,
      });
      src.addFeature(feature);
      result.feature = feature;
    });
  }
  return me;
}

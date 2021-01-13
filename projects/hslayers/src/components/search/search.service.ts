import {HttpClient} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {WKT} from 'ol/format';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
@Injectable({
  providedIn: 'root',
})
export class HsSearchService {
  data: any = {
    providers: {},
  };
  formatWKT = new WKT();
  canceler: Subject<any> = new Subject();
  searchResultsLayer: VectorLayer;
  constructor(
    private http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsConfig: HsConfig,
    public HsMapService: HsMapService,
    public HsStylerService: HsStylerService,
    public HsEventBusService: HsEventBusService
  ) {
    this.searchResultsLayer = new VectorLayer({
      title: 'Search results',
      source: new Vector({}),
      style: this.HsStylerService.pin_white_blue_highlight,
      show_in_manager: false,
    });
  }

  /**
   * @memberof HsSearchService
   * @function request
   * @public
   * @param {string} query Place name or part of it
   * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  request(query: string): void {
    let url = null;
    let providers = [];
    if (
      this.HsConfig.search_provider !== undefined &&
      this.HsConfig.searchProvider === undefined
    ) {
      this.HsConfig.searchProvider = this.HsConfig.search_provider;
    }

    if (this.HsConfig.searchProvider === undefined) {
      providers = ['geonames'];
    } else if (
      typeof this.HsConfig.searchProvider === 'string' ||
      typeof this.HsConfig.searchProvider === 'function'
    ) {
      providers = [this.HsConfig.searchProvider];
    } else if (typeof this.HsConfig.searchProvider === 'object') {
      providers = this.HsConfig.searchProvider;
    }
    this.cleanResults();
    for (const provider of providers) {
      let providerId = provider;
      if (provider == 'geonames') {
        if (this.HsConfig.geonamesUser !== undefined) {
          url = `http://api.geonames.org/searchJSON?&name_startsWith=${query}&username=${this.HsConfig.geonamesUser}`;
        } else {
          //Username will have to be set in proxy
          url = this.HsUtilsService.proxify(
            `http://api.geonames.org/searchJSON?&name_startsWith=${query}`
          );
        }
        if (window.location.protocol == 'https:') {
          url = this.HsUtilsService.proxify(url);
        }
      } else if (provider == 'sdi4apps_openapi') {
        url = 'http://portal.sdi4apps.eu/openapi/search?q=' + query;
      } else if (typeof provider === 'function') {
        url = provider(query);
        if (provider.name == 'searchProvider') {
          //Anonymous function?
          providerId = 'geonames';
        } else {
          providerId = provider.name;
        }
      }
      //url = utils.proxify(url);
      if (this.canceler[providerId] !== undefined) {
        this.canceler[providerId].unsubscribe();
      }
      this.canceler[providerId] = this.http.get(url).subscribe(
        (data) => {
          this.searchResultsReceived(data, providerId);
        },
        () => {}
      );
    }
  }
  /**
   * @memberof HsSearchService
   * @function searchResultsReceived
   * @public
   * @param {object} response Response object of Geolocation request
   * @param {string} providerName Name of request provider
   * @description Maintain inner results object and parse response with correct provider parser
   */
  searchResultsReceived(response: any, providerName: string): void {
    if (this.data.providers[providerName] === undefined) {
      this.data.providers[providerName] = {
        results: [],
        name: providerName,
      };
    }
    const provider = this.data.providers[providerName];
    if (providerName.indexOf('geonames') > -1) {
      this.parseGeonamesResults(response, provider);
    } else if (providerName == 'sdi4apps_openapi') {
      this.parseOpenApiResults(response, provider);
    } else {
      this.parseGeonamesResults(response, provider);
    }
    this.HsEventBusService.searchResultsReceived.next({
      layer: this.searchResultsLayer,
      providers: this.data.providers,
    });
  }
  /**
   * @memberof HsSearchService
   * @function hideResultsLayer
   * @public
   * @description Remove results layer from map
   */
  hideResultsLayer(): void {
    this.HsMapService.map.removeLayer(this.searchResultsLayer);
  }
  /**
   * @memberof HsSearchService
   * @function showResultsLayer
   * @public
   * @description Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  showResultsLayer(): void {
    this.hideResultsLayer();
    this.HsMapService.map.addLayer(this.searchResultsLayer);
  }
  /**
   * @memberof HsSearchService
   * @function cleanResults
   * @public
   * @description Clean all search results from results variable and results layer
   */
  cleanResults(): void {
    if (this.data.providers !== undefined) {
      for (const provider of this.data.providers) {
        if (provider.results !== undefined) {
          provider.results.length = 0;
        }
      }
      this.searchResultsLayer.getSource().clear();
      this.hideResultsLayer();
    }
  }
  /**
   * @memberof HsSearchService
   * @function selectResult
   * @public
   * @param {object} result Entity of selected result
   * @param {number} zoomLevel Zoom level to zoom on
   * @description Move map and zoom on selected search result
   */
  selectResult(result: any, zoomLevel: number): void {
    const coordinate = this.getResultCoordinate(result);
    this.HsMapService.map.getView().setCenter(coordinate);
    if (zoomLevel === undefined) {
      zoomLevel = 10;
    }
    this.HsMapService.map.getView().setZoom(zoomLevel);
    this.HsEventBusService.searchZoomTo.next({
      coordinate: transform(
        coordinate,
        this.HsMapService.getCurrentProj(),
        'EPSG:4326'
      ),
      zoom: zoomLevel,
    });
  }
  /**
   * @memberof HsSearchService
   * @function getResultCoordinate
   * @public
   * @param {object} result Entity of selected result
   * @returns {object} Ol.coordinate of selected result
   * @description Parse coordinate of selected result
   */
  getResultCoordinate(result: any): any {
    const currentProj = this.HsMapService.getCurrentProj();
    if (
      result.provider_name.indexOf('geonames') > -1 ||
      result.provider_name == 'searchFunctionsearchProvider'
    ) {
      return transform(
        [parseFloat(result.lng), parseFloat(result.lat)],
        'EPSG:4326',
        currentProj
      );
    } else if (result.provider_name == 'sdi4apps_openapi') {
      const g_feature = this.formatWKT.readFeature(
        result.FullGeom.toUpperCase()
      );
      return g_feature
        .getGeometry()
        .transform('EPSG:4326', currentProj)
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
  parseGeonamesResults(response: any, provider: any): void {
    provider.results = response.geonames;
    this.generateGeonamesFeatures(provider);
  }
  /**
   * @param provider
   */
  generateGeonamesFeatures(provider: any): void {
    const src = this.searchResultsLayer.getSource();
    for (const result of provider.results) {
      //angular.forEach(provider.results, (result) =>
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(this.getResultCoordinate(result)),
        record: result,
      });
      src.addFeature(feature);
      result.feature = feature;
    }
  }

  /**
   * @memberof HsSearchService
   * @function parseOpenApiResults
   * @private
   * @param {object} response Result of search request
   * @param {object} provider Which provider sent the search results
   * @description Result parser of results from OpenApi service
   */
  parseOpenApiResults(response: any, provider: any): void {
    provider.results = response.data;
    this.generateOpenApiFeatures(provider);
  }
  /**
   * @param provider
   */
  generateOpenApiFeatures(provider: any): void {
    const src = this.searchResultsLayer.getSource();
    for (const result of provider.results) {
      // angular.forEach(provider.results, (result) => {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(this.getResultCoordinate(result)),
        record: result,
      });
      src.addFeature(feature);
      result.feature = feature;
    }
  }
}

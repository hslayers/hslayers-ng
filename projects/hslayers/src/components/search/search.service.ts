import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry, Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {WKT} from 'ol/format';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {setShowInLayerManager, setTitle} from '../../common/layer-extensions';
import {unByKey} from 'ol/Observable';

@Injectable({
  providedIn: 'root',
})
export class HsSearchService {
  data: any = {
    providers: {},
  };
  formatWKT = new WKT();
  canceler: Subject<any> = new Subject();
  searchResultsLayer: VectorLayer<VectorSource<Geometry>>;
  pointerMoveEventKey;
  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsMapService: HsMapService,
    public hsStylerService: HsStylerService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {
    this.searchResultsLayer = new VectorLayer({
      source: new Vector({}),
      style: this.hsStylerService.pin_white_blue_highlight,
    });
    setTitle(this.searchResultsLayer, 'Search results');
    setShowInLayerManager(this.searchResultsLayer, false);
  }

  /**
   * @public
   * @param query - Place name or part of it
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  request(query: string): void {
    let url = null;
    let providers = [];
    if (
      this.hsConfig.search_provider !== undefined &&
      this.hsConfig.searchProvider === undefined
    ) {
      this.hsConfig.searchProvider = this.hsConfig.search_provider;
    }

    if (this.hsConfig.searchProvider === undefined) {
      providers = ['geonames'];
    } else if (
      typeof this.hsConfig.searchProvider === 'string' ||
      typeof this.hsConfig.searchProvider === 'function'
    ) {
      providers = [this.hsConfig.searchProvider];
    } else if (typeof this.hsConfig.searchProvider === 'object') {
      providers = this.hsConfig.searchProvider;
    }
    this.cleanResults();
    for (const provider of providers) {
      let providerId = provider;
      if (provider == 'geonames') {
        if (this.hsConfig.geonamesUser !== undefined) {
          url = `http://api.geonames.org/searchJSON?&name_startsWith=${query}&username=${this.hsConfig.geonamesUser}`;
        } else {
          //Username will have to be set in proxy
          url = this.hsUtilsService.proxify(
            `http://api.geonames.org/searchJSON?&name_startsWith=${query}`
          );
        }
        if (window.location.protocol == 'https:') {
          url = this.hsUtilsService.proxify(url);
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
        () => {
          //
        }
      );
    }
  }
  /**
   * @public
   * @param response - Response object of Geolocation request
   * @param providerName - Name of request provider
   * Maintain inner results object and parse response with correct provider parser
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
    this.pointerMoveEventKey = this.hsMapService.map.on('pointermove', (e) =>
      this.mapPointerMoved(e)
    );
    this.hsEventBusService.searchResultsReceived.next({
      layer: this.searchResultsLayer,
      providers: this.data.providers,
    });
  }
  /**
   * @public
   * Remove results layer from map
   */
  hideResultsLayer(): void {
    this.hsMapService.map.removeLayer(this.searchResultsLayer);
  }
  /**
   * @public
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  showResultsLayer(): void {
    this.hideResultsLayer();
    this.hsMapService.map.addLayer(this.searchResultsLayer);
  }
  /**
   * @public
   * Clean all search results from results variable and results layer
   */
  cleanResults(): void {
    if (this.data.providers !== undefined) {
      for (const key of Object.keys(this.data.providers)) {
        const provider = this.data.providers[key];
        if (provider.results !== undefined) {
          provider.results.length = 0;
        }
      }
      this.searchResultsLayer.getSource().clear();
      this.hideResultsLayer();
      unByKey(this.pointerMoveEventKey);
    }
  }

  /**
   * @param evt -
   * Highlight in the search list result, that corresponds with the nearest found feature under the pointer over the map
   */
  mapPointerMoved(evt): void {
    console.log('searchlistener');
    const featuresUnderMouse = this.hsMapService.map
      .getFeaturesAtPixel(evt.pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature);
        return layer && layer == this.searchResultsLayer;
      });
    for (const provider of Object.keys(this.data.providers)
      .map((key) => this.data.providers[key])
      .filter((provider) => provider?.results)) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse as Feature<Geometry>[],
        this.searchResultsLayer,
        provider.results
      );
    }
  }
  /**
   * @public
   * @param result - Entity of selected result
   * @param zoomLevel - Zoom level to zoom on
   * Move map and zoom on selected search result
   */
  selectResult(result: any, zoomLevel: number): void {
    const coordinate = this.getResultCoordinate(result);
    this.hsMapService.map.getView().setCenter(coordinate);
    if (zoomLevel === undefined) {
      zoomLevel = 10;
    }
    this.hsMapService.map.getView().setZoom(zoomLevel);
    this.hsEventBusService.searchZoomTo.next({
      coordinate: transform(
        coordinate,
        this.hsMapService.getCurrentProj(),
        'EPSG:4326'
      ),
      zoom: zoomLevel,
    });
  }
  /**
   * @public
   * @param result - Entity of selected result
   * @returns Ol.coordinate of selected result
   * Parse coordinate of selected result
   */
  getResultCoordinate(result: any): any {
    const currentProj = this.hsMapService.getCurrentProj();
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
   * @param response - Result of search request
   * @param provider - Which provider sent the search results
   * Result parser of results from Geonames service
   */
  parseGeonamesResults(response: any, provider: any): void {
    provider.results = response.geonames;
    this.generateGeonamesFeatures(provider);
  }
  /**
   * @param provider -
   */
  generateGeonamesFeatures(provider: any): void {
    const src = this.searchResultsLayer.getSource();
    for (const result of provider.results) {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(this.getResultCoordinate(result)),
        record: result,
        id: this.hsUtilsService.generateUuid(),
      });
      feature.setId(feature.get('id'));
      src.addFeature(feature);
      result.featureId = feature.getId();
    }
  }

  /**
   * @param response - Result of search request
   * @param provider - Which provider sent the search results
   * Result parser of results from OpenApi service
   */
  parseOpenApiResults(response: any, provider: any): void {
    provider.results = response.data;
    this.generateOpenApiFeatures(provider);
  }
  /**
   * @param provider -
   */
  generateOpenApiFeatures(provider: any): void {
    const src = this.searchResultsLayer.getSource();
    for (const result of provider.results) {
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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Feature from 'ol/Feature';
import {Geometry, Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
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
class HsSearchData {
  canceler: Subject<any> = new Subject();
  searchResultsLayer: VectorLayer<VectorSource<Geometry>>;
  pointerMoveEventKey;
  providers = {};

  constructor(resultsLayerStyle) {
    this.searchResultsLayer = new VectorLayer({
      source: new Vector({}),
      style: resultsLayerStyle,
    });
    setTitle(this.searchResultsLayer, 'Search results');
    setShowInLayerManager(this.searchResultsLayer, false);
  }
}
@Injectable({
  providedIn: 'root',
})
export class HsSearchService {
  formatWKT = new WKT();
  apps: {[key: string]: HsSearchData} = {};

  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsMapService: HsMapService,
    public hsStylerService: HsStylerService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {}

  init(app: string) {
    if (this.apps[app] == undefined) {
      this.apps[app] = new HsSearchData(
        this.hsStylerService.get(app).pin_white_blue_highlight
      );
    }
  }
  /**
   * @public
   * @param query - Place name or part of it
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  request(query: string, app: string): void {
    let url = null;
    let providers = [];
    if (
      this.hsConfig.get(app).search_provider !== undefined &&
      this.hsConfig.get(app).searchProvider === undefined
    ) {
      this.hsConfig.get(app).searchProvider =
        this.hsConfig.get(app).search_provider;
    }

    if (this.hsConfig.get(app).searchProvider === undefined) {
      providers = ['geonames'];
    } else if (
      typeof this.hsConfig.get(app).searchProvider === 'string' ||
      typeof this.hsConfig.get(app).searchProvider === 'function'
    ) {
      providers = [this.hsConfig.get(app).searchProvider];
    } else if (typeof this.hsConfig.get(app).searchProvider === 'object') {
      providers = this.hsConfig.get(app).searchProvider;
    }
    this.cleanResults(app);
    for (const provider of providers) {
      let providerId = provider;
      if (provider == 'geonames') {
        if (this.hsConfig.get(app).geonamesUser !== undefined) {
          url = `http://api.geonames.org/searchJSON?&name_startsWith=${query}&username=${
            this.hsConfig.get(app).geonamesUser
          }`;
        } else {
          //Username will have to be set in proxy
          url = this.hsUtilsService.proxify(
            `http://api.geonames.org/searchJSON?&name_startsWith=${query}`,
            app
          );
        }
        if (window.location.protocol == 'https:') {
          url = this.hsUtilsService.proxify(url, app);
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
      const canceler = this.apps[app].canceler[providerId];
      if (canceler !== undefined) {
        canceler.unsubscribe();
      }
      this.apps[app].canceler[providerId] = this.http.get(url).subscribe(
        (data) => {
          this.searchResultsReceived(data, providerId, app);
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
  searchResultsReceived(
    response: any,
    providerName: string,
    app: string
  ): void {
    if (this.apps[app].providers[providerName] === undefined) {
      this.apps[app].providers[providerName] = {
        results: [],
        name: providerName,
      };
    }
    const provider = this.apps[app].providers[providerName];
    if (providerName.indexOf('geonames') > -1) {
      this.parseGeonamesResults(response, provider, app);
    } else if (providerName == 'sdi4apps_openapi') {
      this.parseOpenApiResults(response, provider, app);
    } else {
      this.parseGeonamesResults(response, provider, app);
    }
    this.apps[app].pointerMoveEventKey = this.hsMapService
      .getMap(app)
      .on('pointermove', (e) => this.mapPointerMoved(e, app));
    this.hsEventBusService.searchResultsReceived.next({
      app,
    });
  }
  /**
   * @public
   * Remove results layer from map
   */
  hideResultsLayer(app: string): void {
    this.hsMapService
      .getMap(app)
      .removeLayer(this.apps[app].searchResultsLayer);
  }
  /**
   * @public
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   */
  showResultsLayer(app: string): void {
    this.hideResultsLayer(app);
    this.hsMapService.getMap(app).addLayer(this.apps[app].searchResultsLayer);
  }
  /**
   * @public
   * Clean all search results from results variable and results layer
   */
  cleanResults(app: string): void {
    if (this.apps[app].providers !== undefined) {
      for (const key of Object.keys(this.apps[app].providers)) {
        const provider = this.apps[app].providers[key];
        if (provider.results !== undefined) {
          provider.results.length = 0;
        }
      }
      this.apps[app].searchResultsLayer.getSource().clear();
      this.hideResultsLayer(app);
      unByKey(this.apps[app].pointerMoveEventKey);
    }
  }

  /**
   * @param evt -
   * Highlight in the search list result, that corresponds with the nearest found feature under the pointer over the map
   */
  mapPointerMoved(evt, app: string): void {
    console.log('searchlistener');
    const featuresUnderMouse = this.hsMapService
      .getMap(app)
      .getFeaturesAtPixel(evt.pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature, app);
        return layer && layer == this.apps[app].searchResultsLayer;
      });
    for (const provider of Object.keys(this.apps[app].providers)
      .map((key) => this.apps[app].providers[key])
      .filter((provider) => provider?.results)) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse as Feature<Geometry>[],
        this.apps[app].searchResultsLayer,
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
  selectResult(result: any, zoomLevel: number, app: string): void {
    const coordinate = this.getResultCoordinate(result, app);
    this.hsMapService.getMap(app).getView().setCenter(coordinate);
    if (zoomLevel === undefined) {
      zoomLevel = 10;
    }
    this.hsMapService.getMap(app).getView().setZoom(zoomLevel);
    this.hsEventBusService.searchZoomTo.next({
      coordinate: transform(
        coordinate,
        this.hsMapService.getCurrentProj(app),
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
  getResultCoordinate(result: any, app: string): any {
    const currentProj = this.hsMapService.getCurrentProj(app);
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
      return (
        g_feature.getGeometry().transform('EPSG:4326', currentProj) as Point
      ).getCoordinates();
    }
  }

  /**
   * @param response - Result of search request
   * @param provider - Which provider sent the search results
   * Result parser of results from Geonames service
   */
  parseGeonamesResults(response: any, provider: any, app: string): void {
    provider.results = response.geonames;
    this.generateGeonamesFeatures(provider, app);
  }
  /**
   * @param provider -
   */
  generateGeonamesFeatures(provider: any, app: string): void {
    const src = this.apps[app].searchResultsLayer.getSource();
    for (const result of provider.results) {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(this.getResultCoordinate(result, app)),
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
  parseOpenApiResults(response: any, provider: any, app: string): void {
    provider.results = response.data;
    this.generateOpenApiFeatures(provider, app);
  }
  /**
   * @param provider -
   */
  generateOpenApiFeatures(provider: any, app: string): void {
    const src = this.apps[app].searchResultsLayer.getSource();
    for (const result of provider.results) {
      result.provider_name = provider.name;
      const feature = new Feature({
        geometry: new Point(this.getResultCoordinate(result, app)),
        record: result,
      });
      src.addFeature(feature);
      result.feature = feature;
    }
  }
}

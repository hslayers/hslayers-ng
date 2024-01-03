import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {Feature} from 'ol';
import {Geometry, Point} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';
import {transform} from 'ol/proj';
import {unByKey} from 'ol/Observable';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsStylerService} from 'hslayers-ng/components/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {setShowInLayerManager, setTitle} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsSearchService {
  formatWKT = new WKT();
  canceler: Subject<any> = new Subject();
  searchResultsLayer: VectorLayer<VectorSource>;
  pointerMoveEventKey;
  providers = {};

  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsMapService: HsMapService,
    public hsStylerService: HsStylerService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService,
  ) {
    this.searchResultsLayer = new VectorLayer({
      source: new VectorSource({}),
      style: this.hsStylerService.pin_white_blue_highlight,
    });
    setTitle(this.searchResultsLayer, 'Search results');
    setShowInLayerManager(this.searchResultsLayer, false);
  }

  /**
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   * @public
   * @param query - Place name or part of it
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
            `http://api.geonames.org/searchJSON?&name_startsWith=${query}`,
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
      const canceler = this.canceler[providerId];
      if (canceler !== undefined) {
        canceler.unsubscribe();
      }
      this.canceler[providerId] = this.http.get(url).subscribe(
        (data) => {
          this.searchResultsReceived(data, providerId);
        },
        () => {
          //
        },
      );
    }
  }

  /**
   * Maintain inner results object and parse response with correct provider parser
   * @public
   * @param response - Response object of Geolocation request
   * @param providerName - Name of request provider
   */
  searchResultsReceived(response: any, providerName: string): void {
    if (this.providers[providerName] === undefined) {
      this.providers[providerName] = {
        results: [],
        name: providerName,
      };
    }
    const provider = this.providers[providerName];
    if (providerName.indexOf('geonames') > -1) {
      this.parseGeonamesResults(response, provider);
    } else if (providerName == 'sdi4apps_openapi') {
      this.parseOpenApiResults(response, provider);
    } else {
      this.parseGeonamesResults(response, provider);
    }
    this.pointerMoveEventKey = this.hsMapService
      .getMap()
      .on('pointermove', (e) => this.mapPointerMoved(e));
    this.hsEventBusService.searchResultsReceived.next();
  }

  /**
   * Remove results layer from map
   * @public
   */
  hideResultsLayer(): void {
    this.hsMapService.getMap().removeLayer(this.searchResultsLayer);
  }

  /**
   * Send geolocation request to Geolocation server (based on app config), pass response to results function
   * @public
   */
  showResultsLayer(): void {
    this.hideResultsLayer();
    this.hsMapService.getMap().addLayer(this.searchResultsLayer);
  }

  /**
   * Clean all search results from results variable and results layer
   * @public
   */
  cleanResults(): void {
    if (this.providers !== undefined) {
      for (const key of Object.keys(this.providers)) {
        const provider = this.providers[key];
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
   * Highlight in the search list result, that corresponds with the nearest found feature under the pointer over the map
   */
  mapPointerMoved(evt): void {
    const featuresUnderMouse = this.hsMapService
      .getMap()
      .getFeaturesAtPixel(evt.pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature);
        return layer && layer == this.searchResultsLayer;
      });
    for (const provider of Object.keys(this.providers)
      .map((key) => this.providers[key])
      .filter((provider) => provider?.results)) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse as Feature<Geometry>[],
        this.searchResultsLayer,
        provider.results,
      );
    }
  }

  /**
   * Move map and zoom on selected search result
   * @public
   * @param result - Entity of selected result
   * @param zoomLevel - Zoom level to zoom on
   */
  selectResult(result: any, zoomLevel: number): void {
    const coordinate = this.getResultCoordinate(result);
    this.hsMapService.getMap().getView().setCenter(coordinate);
    if (zoomLevel === undefined) {
      zoomLevel = 10;
    }
    this.hsMapService.getMap().getView().setZoom(zoomLevel);
    this.hsEventBusService.searchZoomTo.next({
      coordinate: transform(
        coordinate,
        this.hsMapService.getCurrentProj(),
        'EPSG:4326',
      ),
      zoom: zoomLevel,
    });
  }

  /**
   * Parse coordinate of selected result
   * @public
   * @param result - Entity of selected result
   * @returns Ol.coordinate of selected result
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
        currentProj,
      );
    } else if (result.provider_name == 'sdi4apps_openapi') {
      const g_feature = this.formatWKT.readFeature(
        result.FullGeom.toUpperCase(),
      );
      return (
        g_feature.getGeometry().transform('EPSG:4326', currentProj) as Point
      ).getCoordinates();
    }
  }

  /**
   * Result parser of results from Geonames service
   * @param response - Result of search request
   * @param provider - Which provider sent the search results
   */
  parseGeonamesResults(response: any, provider: any): void {
    provider.results = response.geonames;
    this.generateGeonamesFeatures(provider);
  }

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
   * Result parser of results from OpenApi service
   * @param response - Result of search request
   * @param provider - Which provider sent the search results
   */
  parseOpenApiResults(response: any, provider: any): void {
    provider.results = response.data;
    this.generateOpenApiFeatures(provider);
  }

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

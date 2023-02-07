import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import {Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {ImageWMS, Source, TileWMS, WMTS} from 'ol/source';
import {lastValueFrom} from 'rxjs';

import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryWmtsService} from './query-wmts.service';
import {HsUtilsService, instOf} from '../utils/utils.service';
import {
  getBase,
  getFeatureInfoLang,
  getFeatureInfoTarget,
  getInfoFormat,
  getPopupClass,
  getQueryFilter,
} from '../../common/layer-extensions';
import {jsonGetFeatureInfo} from '../../common/get-feature-info/json-get-feature-info.type';

@Injectable({
  providedIn: 'root',
})
export class HsQueryWmsService {
  infoCounter = 0;
  constructor(
    private hsQueryBaseService: HsQueryBaseService,
    private hsMapService: HsMapService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsLanguageService: HsLanguageService,
    private hsUtilsService: HsUtilsService,
    private httpClient: HttpClient,
    private hsLogService: HsLogService,
    private hsQueryWmtsService: HsQueryWmtsService
  ) {}

  /**
   * Initialize the query WMS service data and subscribers
   * @param _app - App identifier
   */
  init(_app: string): void {
    this.hsQueryBaseService.getFeatureInfoStarted.subscribe(({evt, app}) => {
      if (_app == app) {
        this.infoCounter = 0;
        this.hsMapService
          .getLayersArray(app)
          .forEach((layer: Layer<Source>) => {
            if (getBase(layer) == true || layer.get('queryable') == false) {
              return;
            }
            if (getQueryFilter(layer) != undefined) {
              const filter = getQueryFilter(layer);
              if (!filter(this.hsMapService.getMap(app), layer, evt.pixel)) {
                return;
              }
            }
            this.queryWmsLayer(
              instOf(layer, Tile)
                ? (layer as Layer<TileWMS>)
                : (layer as Layer<ImageWMS>),
              evt.coordinate,
              app
            );
          });
      }
    });
  }

  /**
   * Update feature list
   * @param updated - Feature list has been updated
   * @param group -
   * @param app - App identifier
   */
  updateFeatureList(
    updated: boolean,
    group: {
      layer?: string;
      name?: any;
      attributes?: any[];
    },
    app: string
  ): void {
    const queryBaseAppRef = this.hsQueryBaseService.get(app);
    if (updated) {
      queryBaseAppRef.set(group, 'features');
    }
  }

  /**
   * Request information about clicked WMS layer coordinates
   * @param url - Request URL
   * @param infoFormat - Request information format
   * @param coordinate - Clicked coordinates
   * @param layer - Target layer
   * @param app - App identifier
   */
  async request(
    url: string,
    infoFormat: string,
    coordinate: number[],
    layer: Layer<Source>,
    app: string
  ): Promise<void> {
    const queryBaseAppRef = this.hsQueryBaseService.get(app);
    const req_url = this.hsUtilsService.proxify(url, app, true);
    const reqHash = queryBaseAppRef.currentQuery;
    try {
      const headers = new Headers({'Content-Type': 'text'});
      headers.set('Accept', 'text');
      const response = await lastValueFrom(
        this.httpClient.get(req_url, {
          headers: new HttpHeaders().set('Content-Type', 'text'),
          responseType: 'text',
        })
      );

      if (reqHash != queryBaseAppRef.currentQuery) {
        return;
      }
      this.featureInfoReceived(response, infoFormat, coordinate, layer, app);
    } catch (exception) {
      if (reqHash != queryBaseAppRef.currentQuery) {
        return;
      }
      this.featureInfoError(coordinate, exception, app);
    }
  }

  /**
   * Error callback to decrease infoCounter
   * @param coordinate - Clicked coordinates
   * @param exception - Error caught
   * @param app - App identifier
   */
  featureInfoError(coordinate: number[], exception, app: string): void {
    this.infoCounter--;
    this.hsLogService.warn(exception);
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate, app);
    }
  }

  /**
   * Parse Information from GetFeatureInfo request. If result came in XML format, Infopanel data are updated. If response is in HTML, popup window is updated and shown.
   * @param response - Response of GetFeatureInfoRequest
   * @param infoFormat - Format of GetFeatureInfoResponse
   * @param coordinate - Coordinate of request
   * @param layer - Target layer
   * @param app - App identifier
   */
  featureInfoReceived(
    response: string,
    infoFormat: string,
    coordinate: number[],
    layer: Layer<Source>,
    app: string
  ): void {
    if (infoFormat.includes('xml') || infoFormat.includes('gml')) {
      const parser = new WMSGetFeatureInfo();
      const features = parser.readFeatures(response);
      this.parseXmlResponse(features, layer, app);
    }
    if (infoFormat.includes('html')) {
      if (response.length <= 1) {
        return;
      }
      if (getFeatureInfoTarget(layer) == 'info-panel') {
        this.hsQueryBaseService.pushFeatureInfoHtml(response, app);
      } else {
        this.hsQueryBaseService.fillIframeAndResize(response, true, app);
        if (getPopupClass(layer) != undefined) {
          this.hsQueryBaseService.popupClassname =
            'ol-popup ' + getPopupClass(layer);
        }
      }
    }
    if (infoFormat.includes('json')) {
      this.parseJSONResponse(JSON.parse(response), layer, app);
    }
    this.infoCounter--;
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate, app);
    }
  }

  /**
   * Parse Information from JSON based GetFeatureInfo response.
   * @param response - jsonGetFeatureInfo
   * @param layer - Target layer
   * @param app - App identifier
   */
  parseJSONResponse(
    response: jsonGetFeatureInfo,
    layer: Layer<Source>,
    app: string
  ) {
    for (const feature of response.features) {
      const group = {
        name: 'Feature',
        layer: this.hsLayerUtilsService.getLayerName(layer),
        attributes: Object.entries(feature.properties).map(([key, value]) => {
          return {
            'name': key,
            'value': value,
          };
        }),
      };
      this.updateFeatureList(true, group, app);
    }
  }

  /**
   * Parse Information from XML based GetFeatureInfo response.
   * @param features - Parsed features
   * @param layer - Target layer
   * @param app - App identifier
   */
  parseXmlResponse(
    features: Feature<Geometry>[],
    layer: Layer<Source>,
    app: string
  ): void {
    let updated = false;
    features.forEach((feature) => {
      /**
       * TODO: Layered response need to be refactored as well but I havent found and example yet
       * so I don't really know how to handle those. Multiple layers in one request are handled by loop
       */
      //const layerName = getTitle(layer) || getName(layer);
      // const layers = feature.getElementsByTagName('Layer');
      // for (const fioLayer of Array.from(layers)) {
      //   const featureName = fioLayer.attributes[0].nodeValue;
      //   const attrs = fioLayer.getElementsByTagName('Attribute');
      //   const attributes = [];
      //   for (const attr of Array.from(attrs)) {
      //     attributes.push({
      //       'name': attr.attributes[0].nodeValue,
      //       'value': attr.innerHTML,
      //     });
      //   }
      //   const group = {
      //     layer: layerName,
      //     name: featureName,
      //     attributes,
      //     customInfoTemplate,
      //   };
      //   this.updateFeatureList(updated, group, app);
      // }
      const geometryName = feature.getGeometryName();
      const group = {
        name: 'Feature',
        layer: this.hsLayerUtilsService.getLayerName(layer),
        attributes: Object.entries(feature.getProperties())
          .filter((attr) => attr[0] !== geometryName)
          .map(([key, value]) => {
            updated = true;
            return {
              'name': key,
              'value': value,
            };
          }),
      };
      this.updateFeatureList(updated, group, app);
    });
  }

  /**
   * Acknowledge that queries for clicked coordinates have been collected
   * @param coordinate - Clicked coordinates
   * @param app - App identifier
   */
  queriesCollected(coordinate: number[], app: string): void {
    const invisiblePopup: any = this.hsQueryBaseService.getInvisiblePopup();
    if (
      this.hsQueryBaseService.get(app).features.length > 0 ||
      invisiblePopup.contentDocument.body.innerHTML.length > 30
    ) {
      this.hsQueryBaseService.getFeatureInfoCollected.next(coordinate);
    }
  }

  /**
   * Get FeatureInfo from WMS queryable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
   * @param layer - Layer to Query
   * @param coordinate - Clicked coordinates
   * @param app - App identifier
   */
  queryWmsLayer(
    layer: Layer<TileWMS | ImageWMS | WMTS>,
    coordinate: number[],
    app: string
  ): void {
    if (this.isLayerWmsQueryable(layer)) {
      if (instOf(layer.getSource(), WMTS)) {
        this.hsQueryWmtsService
          .parseRequestURL(layer as Layer<WMTS>, coordinate, app)
          .then((res) => {
            console.log(res);
            this.infoCounter++;
            this.request(res.url, res.format, coordinate, layer, app);
          });
        return;
      }

      let source: ImageWMS | TileWMS;
      if (instOf(layer.getSource(), ImageWMS)) {
        source = layer.getSource() as ImageWMS;
      } else if (instOf(layer.getSource(), TileWMS)) {
        source = layer.getSource() as TileWMS;
      }
      const map = this.hsMapService.getMap(app);
      const viewResolution = map.getView().getResolution();
      let url = source.getFeatureInfoUrl(
        coordinate,
        viewResolution,
        source.getProjection()
          ? source.getProjection()
          : this.hsMapService.getCurrentProj(app),
        {
          INFO_FORMAT: source.getParams().INFO_FORMAT,
          /**
           * FIXME: Might return multiple results for the same layer not always 1 of each
           */
          feature_count: source.getParams().LAYERS.split(',').length || 1,
        }
      );
      if (
        getFeatureInfoLang(layer) &&
        getFeatureInfoLang(layer)[this.hsLanguageService.apps[app].language]
      ) {
        if (instOf(source, TileWMS)) {
          url = url.replace(
            (source as TileWMS).getUrls()[0],
            getFeatureInfoLang(layer)[this.hsLanguageService.apps[app].language]
          );
        } else {
          url = url.replace(
            (source as ImageWMS).getUrl(),
            getFeatureInfoLang(layer)[this.hsLanguageService.apps[app].language]
          );
        }
      }
      if (url) {
        this.hsLogService.log(url);

        if (
          source.getParams().INFO_FORMAT.includes('xml') ||
          source.getParams().INFO_FORMAT.includes('html') ||
          source.getParams().INFO_FORMAT.includes('gml') ||
          source.getParams().INFO_FORMAT.includes('json')
        ) {
          this.infoCounter++;
          this.request(
            url,
            source.getParams().INFO_FORMAT,
            coordinate,
            layer,
            app
          );
        }
      }
    }
  }

  /**
   * Check if the selected layer is queryable
   * @param layer - Layer selected
   * @returns True if the layer is queryable, false otherwise
   */
  isLayerWmsQueryable(layer: Layer<ImageWMS | TileWMS | WMTS>): boolean {
    if (!layer.getVisible()) {
      return false;
    }
    if (instOf(layer, Tile)) {
      if (
        instOf(layer.getSource(), TileWMS) &&
        (layer.getSource() as TileWMS).getParams().INFO_FORMAT
      ) {
        return true;
      }
      if (instOf(layer.getSource(), WMTS) && getInfoFormat(layer)) {
        return true;
      }
    }
    if (
      instOf(layer, ImageLayer) &&
      instOf(layer.getSource(), ImageWMS) &&
      (layer.getSource() as ImageWMS).getParams().INFO_FORMAT
    ) {
      return true;
    }
    return false;
  }
}

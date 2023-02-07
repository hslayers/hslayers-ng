import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {ImageWMS, Source, TileWMS, WMTS} from 'ol/source';
import {lastValueFrom} from 'rxjs';

import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryWmtsService} from './query-wmts.service';
import {HsUtilsService, instOf} from '../utils/utils.service';
import {
  getBase,
  getCustomInfoTemplate,
  getFeatureInfoLang,
  getFeatureInfoTarget,
  getInfoFormat,
  getName,
  getPopupClass,
  getQueryFilter,
  getTitle,
} from '../../common/layer-extensions';

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
      customInfoTemplate?: string | boolean;
    },
    app: string
  ): void {
    const queryBaseAppRef = this.hsQueryBaseService.get(app);
    if (updated) {
      if (group.customInfoTemplate) {
        queryBaseAppRef.set(group, 'customFeatures');
        queryBaseAppRef.dataCleared = false;
      } else {
        queryBaseAppRef.set(group, 'features');
      }
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
    /* Maybe this will work in future OL versions
     * var format = new GML();
     *  console.log(format.readFeatures(response, {}));
     */
    const queryBaseAppRef = this.hsQueryBaseService.get(app);
    const customInfoTemplate = getCustomInfoTemplate(layer) || false;

    if (infoFormat.includes('xml') || infoFormat.includes('gml')) {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;

      //This is suggests that WMTS only provides gml, is that the case?
      //http://opengeospatial.github.io/e-learning/wmts/text/operations.html
      if (infoFormat.includes('gml') || instOf(layer.getSource(), WMTS)) {
        this.parseGmlResponse(doc, layer, customInfoTemplate, app);
      } else if (
        infoFormat == 'text/xml' ||
        infoFormat === 'application/vnd.ogc.wms_xml'
      ) {
        if (doc.childNodes[1]['attributes'] != undefined) {
          const group = {
            name: 'Feature',
            attributes: doc.childNodes[1]['attributes'],
            layer: getTitle(layer) || getName(layer),
            customInfoTemplate: customInfoTemplate,
          };
          if (customInfoTemplate) {
            queryBaseAppRef.set(group, 'customFeatures');
            queryBaseAppRef.dataCleared = false;
          } else {
            queryBaseAppRef.set(group, 'features');
          }
        } else {
          return;
        }
      }
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
      const resJSON = JSON.parse(response);
      this.hsQueryBaseService.get(app).set(resJSON.features, 'customFeatures');
      console.log('jsonquery');
    }
    this.infoCounter--;
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate, app);
    }
  }

  /**
   * Parse Information from GetFeatureInfo request. If result came in XML format, Infopanel data are updated. If response is in HTML, popup window is updated and shown.
   * @param doc - Parsed HTML document from GetFeatureInfoRequest response
   * @param layer - Target layer
   * @param customInfoTemplate - Custom info template
   * @param app - App identifier
   */
  parseGmlResponse(
    doc: HTMLElement,
    layer: Layer<Source>,
    customInfoTemplate: string | boolean,
    app: string
  ): void {
    let updated = false;
    let features = doc.querySelectorAll('gml\\:featureMember');
    if (features.length == 0) {
      features = doc.querySelectorAll('featureMember');
    }
    features.forEach((feature) => {
      const layerName = getTitle(layer) || getName(layer);
      const layers = feature.getElementsByTagName('Layer');
      for (const fioLayer of Array.from(layers)) {
        const featureName = fioLayer.attributes[0].nodeValue;
        const attrs = fioLayer.getElementsByTagName('Attribute');
        const attributes = [];
        for (const attr of Array.from(attrs)) {
          attributes.push({
            'name': attr.attributes[0].nodeValue,
            'value': attr.innerHTML,
          });
        }
        const group = {
          layer: layerName,
          name: featureName,
          attributes,
          customInfoTemplate,
        };
        this.updateFeatureList(updated, group, app);
      }
      const featureNode = feature.firstElementChild;
      const group = {
        name: 'Feature',
        layer: this.hsLayerUtilsService.getLayerName(layer),
        attributes: [],
      };
      for (const attribute in featureNode.children) {
        if (featureNode.children[attribute].childElementCount == 0) {
          group.attributes.push({
            'name': featureNode.children[attribute].localName,
            'value': featureNode.children[attribute].innerHTML,
          });
          updated = true;
        }
      }
      this.updateFeatureList(updated, group, app);
    });
    const msGMLOutputs = doc.querySelectorAll('msGMLOutput');
    if (msGMLOutputs?.length > 0) {
      msGMLOutputs.forEach((output) => {
        this.extractMsGMLAttributes(output, updated, customInfoTemplate, app);
      });
    } else if (doc.nodeName == 'msGMLOutput') {
      this.extractMsGMLAttributes(doc, updated, customInfoTemplate, app);
    }
  }

  /**
   * Extract MsGMLOutput feature attributes
   * @param output - MsGMLOutput from parsed HTML document
   * @param updated - Is feature list updated
   * @param customInfoTemplate - Custom info template
   * @param app - App identifier
   */
  extractMsGMLAttributes(
    output: Element,
    updated: boolean,
    customInfoTemplate: string | boolean,
    app: string
  ): void {
    for (const layer_i in output.children) {
      const layer = output.children[layer_i];
      let layer_name = '';
      if (layer.children == undefined) {
        continue;
      }
      for (let feature_i = 0; feature_i < layer.children.length; feature_i++) {
        const feature = layer.children[feature_i];
        if (feature.nodeName == 'gml:name') {
          layer_name = feature.innerHTML;
        } else {
          const group = {
            name: layer_name + ' Feature',
            attributes: [],
            customInfoTemplate,
          };
          for (const attribute in feature.children) {
            if (feature.children[attribute].childElementCount == 0) {
              group.attributes.push({
                'name': feature.children[attribute].localName,
                'value': feature.children[attribute].innerHTML,
              });
              updated = true;
            }
          }
          this.updateFeatureList(updated, group, app);
        }
      }
    }
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

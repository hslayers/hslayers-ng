import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {ImageWMS, Source, TileWMS, WMTS} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryWmtsService} from './query-wmts.service';
import {HsUtilsService} from '../utils/utils.service';
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
    public hsQueryBaseService: HsQueryBaseService,
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLanguageService: HsLanguageService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    private httpClient: HttpClient,
    public hsLogService: HsLogService,
    public hsQueryWmtsService: HsQueryWmtsService
  ) {
    this.hsQueryBaseService.getFeatureInfoStarted.subscribe((evt) => {
      this.infoCounter = 0;
      this.hsMapService.getLayersArray().forEach((layer: Layer<Source>) => {
        if (getBase(layer) == true || layer.get('queryable') == false) {
          return;
        }
        if (getQueryFilter(layer) != undefined) {
          const filter = getQueryFilter(layer);
          if (!filter(hsMapService.map, layer, evt.pixel)) {
            return;
          }
        }
        this.queryWmsLayer(
          this.hsUtilsService.instOf(layer, Tile)
            ? (layer as Layer<TileWMS>)
            : (layer as Layer<ImageWMS>),
          evt.coordinate
        );
      });
    });
  }

  /**
   * @param updated -
   * @param customInfoTemplate -
   * @param group -
   */
  updateFeatureList(updated, customInfoTemplate, group): void {
    if (updated) {
      if (customInfoTemplate) {
        this.hsQueryBaseService.setData(group, 'customFeatures');
        this.hsQueryBaseService.dataCleared = false;
      } else {
        this.hsQueryBaseService.setData(group, 'features');
      }
    }
  }

  async request(url, infoFormat, coordinate: number[], layer): Promise<void> {
    const req_url = this.hsUtilsService.proxify(url, true);
    const reqHash = this.hsQueryBaseService.currentQuery;
    try {
      const headers = new Headers({'Content-Type': 'text'});
      headers.set('Accept', 'text');
      const response = await this.httpClient
        .get(req_url, {
          headers: new HttpHeaders().set('Content-Type', 'text'),
          responseType: 'text',
        })
        .toPromise();

      if (reqHash != this.hsQueryBaseService.currentQuery) {
        return;
      }
      this.featureInfoReceived(response, infoFormat, coordinate, layer);
    } catch (exception) {
      if (reqHash != this.hsQueryBaseService.currentQuery) {
        return;
      }
      this.featureInfoError(coordinate, exception);
    }
  }

  /**
   * Error callback to decrease infoCounter
   * @param exception -
   * @param coordinate -
   */
  featureInfoError(coordinate, exception): void {
    this.infoCounter--;
    this.hsLogService.warn(exception);
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate);
    }
  }

  /**
   * Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
   * @param response - Response of GetFeatureInfoRequest
   * @param infoFormat - Format of GetFeatureInfoResponse
   * @param coordinate - Coordinate of request
   * @param layer -
   */
  featureInfoReceived(
    response,
    infoFormat: string,
    coordinate: number[],
    layer
  ): void {
    /* Maybe this will work in future OL versions
     * var format = new GML();
     *  console.log(format.readFeatures(response, {}));
     */
    const customInfoTemplate = getCustomInfoTemplate(layer) || false;

    if (infoFormat.includes('xml') || infoFormat.includes('gml')) {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;

      if (
        infoFormat.includes('gml') ||
        this.hsUtilsService.instOf(layer.getSource(), WMTS)
      ) {
        this.parseGmlResponse(doc, layer, customInfoTemplate);
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
            this.hsQueryBaseService.setData(group, 'customFeatures');
            this.hsQueryBaseService.dataCleared = false;
          } else {
            this.hsQueryBaseService.setData(group, 'features');
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
        this.hsQueryBaseService.pushFeatureInfoHtml(response);
      } else {
        this.hsQueryBaseService.fillIframeAndResize(response, true);
        if (getPopupClass(layer) != undefined) {
          this.hsQueryBaseService.popupClassname =
            'ol-popup ' + getPopupClass(layer);
        }
      }
    }
    if (infoFormat.includes('json')) {
      const resJSON = JSON.parse(response);
      this.hsQueryBaseService.setData(resJSON.features, 'customFeatures');
      console.log('jsonquery');
    }
    this.infoCounter--;
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate);
    }
  }

  parseGmlResponse(doc, layer: Layer<Source>, customInfoTemplate): void {
    let updated = false;
    let features = doc.querySelectorAll('gml\\:featureMember');
    if (features.length == 0) {
      features = doc.querySelectorAll('featureMember');
    }
    for (const feature of features) {
      const layerName = getTitle(layer) || getName(layer);
      const layers = feature.getElementsByTagName('Layer');
      for (const fioLayer of layers) {
        const featureName = fioLayer.attributes[0].nodeValue;
        const attrs = fioLayer.getElementsByTagName('Attribute');
        const attributes = [];
        for (const attr of attrs) {
          attributes.push({
            'name': attr.attributes[0].nodeValue,
            'value': attr.innerHTML,
          });
        }
        const group = {
          layer: layerName,
          name: featureName,
          attributes: attributes,
          customInfoTemplate: customInfoTemplate,
        };
        this.updateFeatureList(updated, customInfoTemplate, group);
      }
      const featureNode = feature.firstChild;
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
      this.updateFeatureList(updated, customInfoTemplate, group);
    }
    doc.querySelectorAll('msGMLOutput').forEach(($this) => {
      for (const layer_i in $this.children) {
        const layer = $this.children[layer_i];
        let layer_name = '';
        if (layer.children == undefined) {
          continue;
        }
        for (
          let feature_i = 0;
          feature_i < layer.children.length;
          feature_i++
        ) {
          const feature = layer.children[feature_i];
          if (feature.nodeName == 'gml:name') {
            layer_name = feature.innerHTML;
          } else {
            const group = {
              name: layer_name + ' Feature',
              attributes: [],
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
            this.updateFeatureList(updated, customInfoTemplate, group);
          }
        }
      }
    });
  }

  /**
   * @param coordinate -
   */
  queriesCollected(coordinate: number[]): void {
    const invisiblePopup: any = this.hsQueryBaseService.getInvisiblePopup();
    if (
      this.hsQueryBaseService.data.features.length > 0 ||
      invisiblePopup.contentDocument.body.innerHTML.length > 30
    ) {
      this.hsQueryBaseService.getFeatureInfoCollected.next(coordinate);
    }
  }

  /**
   * Get FeatureInfo from WMS queryable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
   * @param layer - Layer to Query
   * @param coordinate -
   */
  queryWmsLayer(layer: Layer<ImageWMS | TileWMS>, coordinate: number[]) {
    if (this.isLayerWmsQueryable(layer)) {
      if (this.hsUtilsService.instOf(layer.getSource(), WMTS)) {
        this.hsQueryWmtsService
          .parseRequestUrl(layer, coordinate)
          .then((res) => {
            console.log(res);
            this.infoCounter++;
            this.request(res.url, res.format, coordinate, layer);
          });
        return;
      }

      const source = layer.getSource();
      const map = this.hsMapService.map;
      const viewResolution = map.getView().getResolution();
      let url = source.getFeatureInfoUrl(
        coordinate,
        viewResolution,
        source.getProjection()
          ? source.getProjection()
          : this.hsMapService.getCurrentProj(),
        {
          INFO_FORMAT: source.getParams().INFO_FORMAT,
        }
      );
      if (
        getFeatureInfoLang(layer) &&
        getFeatureInfoLang(layer)[this.hsLanguageService.language]
      ) {
        if (this.hsUtilsService.instOf(source, TileWMS)) {
          url = url.replace(
            (source as TileWMS).getUrls()[0],
            getFeatureInfoLang(layer)[this.hsLanguageService.language]
          );
        } else {
          url = url.replace(
            (source as ImageWMS).getUrl(),
            getFeatureInfoLang(layer)[this.hsLanguageService.language]
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
          this.request(url, source.getParams().INFO_FORMAT, coordinate, layer);
        }
      }
    }
  }

  /**
   * @param layer - Selected layer
   */
  isLayerWmsQueryable(layer): boolean {
    if (!layer.getVisible()) {
      return false;
    }
    if (this.hsUtilsService.instOf(layer, Tile)) {
      if (
        this.hsUtilsService.instOf(layer.getSource(), TileWMS) &&
        layer.getSource().getParams().INFO_FORMAT
      ) {
        return true;
      }
      if (
        this.hsUtilsService.instOf(layer.getSource(), WMTS) &&
        getInfoFormat(layer)
      ) {
        return true;
      }
    }
    if (
      this.hsUtilsService.instOf(layer, ImageLayer) &&
      this.hsUtilsService.instOf(layer.getSource(), ImageWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    return false;
  }
}

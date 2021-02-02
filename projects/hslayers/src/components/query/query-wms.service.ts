import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {ImageWMS, TileWMS, WMTS} from 'ol/source';
import {Injectable} from '@angular/core';

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
  getTitle,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsQueryWmsService {
  infoCounter = 0;
  constructor(
    public HsQueryBaseService: HsQueryBaseService,
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLanguageService: HsLanguageService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    private HttpClient: HttpClient,
    public HsLogService: HsLogService,
    public HsQueryWmtsService: HsQueryWmtsService
  ) {
    this.HsQueryBaseService.getFeatureInfoStarted.subscribe((evt) => {
      this.infoCounter = 0;
      this.HsMapService.map.getLayers().forEach((layer) => {
        if (getBase(layer) == true || layer.get('queriable') == false) {
          return;
        }
        if (layer.get('queryFilter') != undefined) {
          const filter = layer.get('queryFilter');
          if (filter(HsMapService.map, layer, evt.pixel)) {
            this.queryWmsLayer(layer, evt.coordinate);
          }
        } else {
          this.queryWmsLayer(layer, evt.coordinate);
        }
      });
    });
  }

  /**
   * @param updated
   * @param customInfoTemplate
   * @param Base
   * @param group
   */
  updateFeatureList(updated, customInfoTemplate, Base, group): void {
    if (updated) {
      if (customInfoTemplate) {
        Base.setData(group, 'customFeatures');
        Base.dataCleared = false;
      } else {
        Base.setData(group, 'features');
      }
    }
  }

  async request(url, infoFormat, coordinate, layer): Promise<void> {
    const req_url = this.HsUtilsService.proxify(url, true);
    const reqHash = this.HsQueryBaseService.currentQuery;
    try {
      const headers = new Headers({'Content-Type': 'text'});
      headers.set('Accept', 'text');
      const response = await this.HttpClient.get(req_url, {
        headers: new HttpHeaders().set('Content-Type', 'text'),
        responseType: 'text',
      }).toPromise();

      if (reqHash != this.HsQueryBaseService.currentQuery) {
        return;
      }
      this.featureInfoReceived(response, infoFormat, url, coordinate, layer);
    } catch (exception) {
      if (reqHash != this.HsQueryBaseService.currentQuery) {
        return;
      }
      this.featureInfoError(coordinate, exception);
    }
  }

  /**
   * @function featureInfoError
   * @description Error callback to decrease infoCounter
   * @param exception
   * @param coordinate
   */
  featureInfoError(coordinate, exception): void {
    this.infoCounter--;
    this.HsLogService.warn(exception);
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate);
    }
  }

  /**
   * @function featureInfoReceived
   * @description Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
   * @param {Object} response Response of GetFeatureInfoRequest
   * @param {string} infoFormat Format of GetFeatureInfoResponse
   * @param {string} url Url of request
   * @param {Ol.coordinate object} coordinate Coordinate of request
   * @param layer
   */
  featureInfoReceived(
    response,
    infoFormat: string,
    url,
    coordinate,
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
        this.HsUtilsService.instOf(layer.getSource(), WMTS)
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
            this.HsQueryBaseService.setData(group, 'customFeatures');
            this.HsQueryBaseService.dataCleared = false;
          } else {
            this.HsQueryBaseService.setData(group, 'features');
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
        this.HsQueryBaseService.pushFeatureInfoHtml(response);
      } else {
        this.HsQueryBaseService.fillIframeAndResize(response, true);
        if (layer.get('popupClass') != undefined) {
          this.HsQueryBaseService.popupClassname =
            'ol-popup ' + layer.get('popupClass');
        }
      }
    }
    this.infoCounter--;
    if (this.infoCounter === 0) {
      this.queriesCollected(coordinate);
    }
  }

  parseGmlResponse(doc, layer: Layer, customInfoTemplate): void {
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
        this.updateFeatureList(
          updated,
          customInfoTemplate,
          this.HsQueryBaseService,
          group
        );
      }
      const featureNode = feature.firstChild;
      const group = {
        name: 'Feature',
        layer: this.HsLayerUtilsService.getLayerName(layer),
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
      this.updateFeatureList(
        updated,
        customInfoTemplate,
        this.HsQueryBaseService,
        group
      );
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
            this.updateFeatureList(
              updated,
              customInfoTemplate,
              this.HsQueryBaseService,
              group
            );
          }
        }
      }
    });
  }

  /**
   * @param coordinate
   */
  queriesCollected(coordinate): void {
    const invisiblePopup: any = this.HsQueryBaseService.getInvisiblePopup();
    if (
      this.HsQueryBaseService.data.features.length > 0 ||
      invisiblePopup.contentDocument.body.innerHTML.length > 30
    ) {
      this.HsQueryBaseService.getFeatureInfoCollected.next(coordinate);
    }
  }

  /**
   * @function queryWmsLayer
   * @description Get FeatureInfo from WMS queriable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
   * @param {Ol.Layer} layer Layer to Query
   * @param {Ol.coordinate} coordinate
   */
  queryWmsLayer(layer: Layer, coordinate) {
    if (this.isLayerWmsQueryable(layer)) {
      if (this.HsUtilsService.instOf(layer.getSource(), WMTS)) {
        this.HsQueryWmtsService.parseRequestUrl(layer, coordinate).then(
          (res) => {
            console.log(res);
            this.infoCounter++;
            this.request(res.url, res.format, coordinate, layer);
          }
        );
        return;
      }

      const source = layer.getSource();
      const map = this.HsMapService.map;
      const viewResolution = map.getView().getResolution();
      let url = source.getFeatureInfoUrl(
        coordinate,
        viewResolution,
        source.getProjection()
          ? source.getProjection()
          : this.HsMapService.getCurrentProj(),
        {
          INFO_FORMAT: source.getParams().INFO_FORMAT,
        }
      );
      if (
        getFeatureInfoLang(layer) &&
        getFeatureInfoLang(layer)[this.HsLanguageService.language]
      ) {
        url = url.replace(
          source.getUrl(),
          getFeatureInfoLang(layer)[this.HsLanguageService.language]
        );
      }
      if (url) {
        this.HsLogService.log(url);

        if (
          source.getParams().INFO_FORMAT.includes('xml') ||
          source.getParams().INFO_FORMAT.includes('html') ||
          source.getParams().INFO_FORMAT.includes('gml')
        ) {
          this.infoCounter++;
          this.request(url, source.getParams().INFO_FORMAT, coordinate, layer);
        }
      }
    }
  }

  /**
   * @param layer
   */
  isLayerWmsQueryable(layer): boolean {
    if (!layer.getVisible()) {
      return false;
    }
    if (this.HsUtilsService.instOf(layer, Tile)) {
      if (
        this.HsUtilsService.instOf(layer.getSource(), TileWMS) &&
        layer.getSource().getParams().INFO_FORMAT
      ) {
        return true;
      }
      if (
        this.HsUtilsService.instOf(layer.getSource(), WMTS) &&
        getInfoFormat(layer)
      ) {
        return true;
      }
    }
    if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    return false;
  }
}

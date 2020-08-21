import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {Injectable} from '@angular/core';
import {TileWMS} from 'ol/source';

@Injectable({
  providedIn: 'root',
})
export class HsQueryWmsService {
  constructor(
    private HsQueryBaseService: HsQueryBaseService,
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLanguageService: HsLanguageService,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService
  ) {
    this.infoCounter = 0;

    $rootScope.$on('mapQueryStarted', (e, evt) => {
      this.infoCounter = 0;
      HsMapService.map.getLayers().forEach((layer) => {
        if (layer.get('base') == true || layer.get('queriable') == false) {
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
  updateFeatureList(updated, customInfoTemplate, Base, group) {
    if (updated) {
      if (customInfoTemplate) {
        Base.setData(group, 'customFeatures');
        Base.dataCleared = false;
      } else {
        Base.setData(group, 'features');
      }
    }
  }

  request(url, infoFormat, coordinate, layer) {
    const req_url = HsUtilsService.proxify(url, true);
    const reqHash = HsQueryBaseService.currentQuery;
    $http({url: req_url})
      .then((response) => {
        if (reqHash != HsQueryBaseService.currentQuery) {
          return;
        }
        this.featureInfoReceived(
          response.data,
          infoFormat,
          url,
          coordinate,
          layer
        );
      })
      .catch((err) => {
        if (reqHash != HsQueryBaseService.currentQuery) {
          return;
        }
        this.featureInfoError(coordinate);
      });
  }

  /**
   * @function featureInfoError
   * @memberOf hs.query.service_getwmsfeatureinfo
   * @description Error callback to decrease infoCounter
   * @param coordinate
   */
  featureInfoError(coordinate) {
    this.infoCounter--;
    if (this.infoCounter === 0) {
      queriesCollected(coordinate);
    }
  }

  /**
   * @function featureInfoReceived
   * @memberOf hs.query.service_getwmsfeatureinfo
   * @params {Object} response Response of GetFeatureInfoRequest
   * @params {string} infoFormat Format of GetFeatureInfoResponse
   * @params {string} url Url of request
   * @params {Ol.coordinate object} coordinate Coordinate of request
   * Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
   * @param response
   * @param infoFormat
   * @param url
   * @param coordinate
   * @param layer
   */
  featureInfoReceived(response, infoFormat, url, coordinate, layer) {
    /* Maybe this will work in future OL versions
     * var format = new GML();
     *  console.log(format.readFeatures(response, {}));
     */
    const customInfoTemplate = layer.get('customInfoTemplate') || false;

    if (infoFormat.indexOf('xml') > 0 || infoFormat.indexOf('gml') > 0) {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;

      if (infoFormat.indexOf('gml') > 0) {
        this.parseGmlResponse(doc, layer, customInfoTemplate);
      } else if (
        infoFormat == 'text/xml' ||
        infoFormat === 'application/vnd.ogc.wms_xml'
      ) {
        if (angular.isDefined(doc.childNodes[1].attributes)) {
          const group = {
            name: 'Feature',
            attributes: doc.childNodes[1].attributes,
            layer: layer.get('title') || layer.get('name'),
            customInfoTemplate: customInfoTemplate,
          };
          if (customInfoTemplate) {
            HsQueryBaseService.setData(group, 'customFeatures');
            HsQueryBaseService.dataCleared = false;
          } else {
            HsQueryBaseService.setData(group, 'features');
          }
        } else {
          return;
        }
      }
    }
    if (infoFormat.indexOf('html') > 0) {
      if (response.length <= 1) {
        return;
      }
      if (layer.get('getFeatureInfoTarget') == 'info-panel') {
        HsQueryBaseService.pushFeatureInfoHtml(response);
      } else {
        HsQueryBaseService.fillIframeAndResize(
          HsQueryBaseService.getInvisiblePopup(),
          response,
          true
        );
        if (layer.get('popupClass') != undefined) {
          HsQueryBaseService.popupClassname =
            'ol-popup ' + layer.get('popupClass');
        }
      }
    }
    this.infoCounter--;
    if (this.infoCounter === 0) {
      queriesCollected(coordinate);
    }
  }

  parseGmlResponse(doc, layer, customInfoTemplate) {
    let updated = false;
    let features = doc.querySelectorAll('gml\\:featureMember');
    if (features.length == 0) {
      features = doc.querySelectorAll('featureMember');
    }
    angular.forEach(features, (feature) => {
      const layerName = layer.get('title') || layer.get('name');
      const layers = feature.getElementsByTagName('Layer');
      angular.forEach(layers, (fioLayer) => {
        const featureName = fioLayer.attributes[0].nodeValue;
        const attrs = fioLayer.getElementsByTagName('Attribute');
        const attributes = [];
        angular.forEach(attrs, (attr) => {
          attributes.push({
            'name': attr.attributes[0].nodeValue,
            'value': attr.innerHTML,
          });
        });
        const group = {
          layer: layerName,
          name: featureName,
          attributes: attributes,
          customInfoTemplate: customInfoTemplate,
        };
        updateFeatureList(
          updated,
          customInfoTemplate,
          HsQueryBaseService,
          group
        );
      });
      const featureNode = feature.firstChild;
      const group = {
        name: 'Feature',
        layer: HsLayerUtilsService.getLayerName(layer),
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
      updateFeatureList(updated, customInfoTemplate, HsQueryBaseService, group);
    });
    doc.querySelectorAll('msGMLOutput').forEach(($this) => {
      for (const layer_i in $this.children) {
        const layer = $this.children[layer_i];
        let layer_name = '';
        if (angular.isUndefined(layer.children)) {
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
            updateFeatureList(
              updated,
              customInfoTemplate,
              HsQueryBaseService,
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
  queriesCollected(coordinate) {
    const invisiblePopup = HsQueryBaseService.getInvisiblePopup();
    if (
      HsQueryBaseService.data.features.length > 0 ||
      invisiblePopup.contentDocument.body.innerHTML.length > 30
    ) {
      $rootScope.$broadcast('queryWmsResult', coordinate);
    }
  }

  /**
   * @function queryWmsLayer
   * @memberOf HsQueryController
   * @params {Ol.Layer} layer Layer to Query
   * @params {Ol.coordinate} coordinate
   * Get FeatureInfo from WMS queriable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
   * @param layer
   * @param coordinate
   */
  queryWmsLayer(layer, coordinate) {
    if (isLayerWmsQueryable(layer)) {
      const source = layer.getSource();
      const map = HsMapService.map;
      const viewResolution = map.getView().getResolution();
      let url = source.getFeatureInfoUrl(
        coordinate,
        viewResolution,
        source.getProjection()
          ? source.getProjection()
          : map.getView().getProjection(),
        {
          'INFO_FORMAT': source.getParams().INFO_FORMAT,
        }
      );
      if (
        angular.isDefined(layer.get('featureInfoLang')) &&
        angular.isDefined(
          layer.get('featureInfoLang')[HsLanguageService.language]
        )
      ) {
        url = url.replace(
          source.getUrl(),
          layer.get('featureInfoLang')[HsLanguageService.language]
        );
      }
      if (url) {
        if (console) {
          console.log(url);
        }

        if (
          source.getParams().INFO_FORMAT.indexOf('xml') > 0 ||
          source.getParams().INFO_FORMAT.indexOf('html') > 0 ||
          source.getParams().INFO_FORMAT.indexOf('gml') > 0
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
  isLayerWmsQueryable(layer) {
    if (!layer.getVisible()) {
      return false;
    }
    if (
      HsUtilsService.instOf(layer, Tile) &&
      HsUtilsService.instOf(layer.getSource(), TileWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    if (
      HsUtilsService.instOf(layer, ImageLayer) &&
      HsUtilsService.instOf(layer.getSource(), ImageWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    return false;
  }
}

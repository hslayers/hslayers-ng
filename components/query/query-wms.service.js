import {TileWMS} from 'ol/source';
import {ImageWMS} from 'ol/source';
import {Tile, Image as ImageLayer} from 'ol/layer';

export default ['$rootScope', '$http', '$sce', 'hs.query.baseService', 'hs.map.service', 'hs.utils.service', 'Core', 'hs.language.service',
  function ($rootScope, $http, $sce, Base, OlMap, utils, Core, languageService) {
    const me = this;

    me.infoCounter = 0;

    this.request = function (url, infoFormat, coordinate, layer) {
      const req_url = utils.proxify(url, true);
      const reqHash = Base.currentQuery;
      $http({url: req_url}).
        then((response) => {
          if (reqHash != Base.currentQuery) {
            return;
          }
          me.featureInfoReceived(response.data, infoFormat, url, coordinate, layer);
        })
        .catch ((err) => {
          if (reqHash != Base.currentQuery) {
            return;
          }
          me.featureInfoError(coordinate);
        });
    };

    /**
        * @function featureInfoError
        * @memberOf hs.query.service_getwmsfeatureinfo
        * @description Error callback to decrease infoCounter
        */
    this.featureInfoError = function (coordinate) {
      me.infoCounter--;
      if (me.infoCounter === 0) {
        queriesCollected(coordinate);
      }
    };
    /**
        * @function featureInfoReceived
        * @memberOf hs.query.service_getwmsfeatureinfo
        * @params {Object} response Response of GetFeatureInfoRequest
        * @params {String} infoFormat Format of GetFeatureInfoResponse
        * @params {String} url Url of request
        * @params {Ol.coordinate object} coordinate Coordinate of request
        * Parse Information from GetFeatureInfo request. If result came in xml format, Infopanel data are updated. If response is in html, popup window is updated and shown.
        */
    this.featureInfoReceived = function (response, infoFormat, url, coordinate, layer) {
      /* Maybe this will work in future OL versions
             * var format = new GML();
             *  console.log(format.readFeatures(response, {}));
             */
      let updated = false;
      const customInfoTemplate = layer.get('customInfoTemplate') || false;

      if (infoFormat.indexOf('xml') > 0 || infoFormat.indexOf('gml') > 0) {
        const oParser = new DOMParser();
        const oDOM = oParser.parseFromString(response, 'application/xml');
        const doc = oDOM.documentElement;

        if (infoFormat.indexOf('gml') > 0) {
          const features = doc.querySelectorAll('gml\\:featureMember') ||
          doc.querySelectorAll('featureMember');
          angular.forEach(features, (feature) => {
            const layerName = layer.get('title') || layer.get('name');
            const layers = feature.getElementsByTagName('Layer');
            angular.forEach(layers, (layer) => {
              const featureName = layer.attributes[0].nodeValue;
              const attrs = layer.getElementsByTagName('Attribute');
              const attributes = [];
              angular.forEach(attrs, (attr) => {
                attributes.push({
                  'name': attr.attributes[0].nodeValue,
                  'value': attr.innerHTML
                });
                updated = true;
              });
              const group = {
                layer: layerName,
                name: featureName,
                attributes: attributes,
                customInfoTemplate: customInfoTemplate

              };
              if (customInfoTemplate) {
                Base.setData(group, 'customFeatures');
                Base.dataCleared = false;
              } else {
                Base.setData(group, 'features');
              }
            });
          });
          doc.querySelectorAll('featureMember').forEach(($this) => {
            const feature = $this.firstChild;
            const group = {
              name: 'Feature',
              attributes: []
            };

            for (const attribute in feature.children) {
              if (feature.children[attribute].childElementCount == 0) {
                group.attributes.push({
                  'name': feature.children[attribute].localName,
                  'value': feature.children[attribute].innerHTML
                });
                updated = true;
              }
            }
            if (updated) {
              if (customInfoTemplate) {
                Base.setData(group, 'customFeatures');
                Base.dataCleared = false;
              } else {
                Base.setData(group, 'features');
              }
            }
          });
          doc.querySelectorAll('msGMLOutput').forEach(($this) => {
            for (const layer_i in $this.children) {
              const layer = $this.children[layer_i];
              let layer_name = '';
              if (typeof layer.children == 'undefined') {
                continue;
              }
              for (let feature_i = 0; feature_i < layer.children.length; feature_i++) {
                const feature = layer.children[feature_i];
                if (feature.nodeName == 'gml:name') {
                  layer_name = feature.innerHTML;
                } else {
                  const group = {
                    name: layer_name + ' Feature',
                    attributes: []
                  };

                  for (const attribute in feature.children) {
                    if (feature.children[attribute].childElementCount == 0) {
                      group.attributes.push({
                        'name': feature.children[attribute].localName,
                        'value': feature.children[attribute].innerHTML
                      });
                      updated = true;
                    }
                  }
                  if (updated) {
                    if (customInfoTemplate) {
                      Base.setData(group, 'customFeatures');
                      Base.dataCleared = false;
                    } else {
                      Base.setData(group, 'features');
                    }
                  }
                }

              }
            }
          });
        } else if (infoFormat == 'text/xml' || infoFormat === 'application/vnd.ogc.wms_xml') {
          if (angular.isDefined(doc.childNodes[1].attributes)) {
            const group = {
              name: 'Feature',
              attributes: doc.childNodes[1].attributes,
              layer: layer.get('title') || layer.get('name'),
              customInfoTemplate: customInfoTemplate
            };
            if (customInfoTemplate) {
              Base.setData(group, 'customFeatures');
              Base.dataCleared = false;
            } else {
              Base.setData(group, 'features');
            };
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
          Base.pushFeatureInfoHtml(response);
        } else {
          Base.fillIframeAndResize(Base.getInvisiblePopup(), response, true);
          if (layer.get('popupClass') != undefined) {
            Base.popupClassname = 'ol-popup ' + layer.get('popupClass');
          }
        }
      }
      me.infoCounter--;
      if (me.infoCounter === 0) {
        queriesCollected(coordinate);
      }
    };

    function queriesCollected(coordinate) {
      const invisiblePopup = Base.getInvisiblePopup();
      if (Base.data.features.length > 0 || invisiblePopup.contentDocument.body.innerHTML.length > 30) {
        $rootScope.$broadcast('queryWmsResult', coordinate);
      }
    }

    /**
        * @function queryWmsLayer
        * @memberOf hs.query.controller
        * @params {Ol.Layer} layer Layer to Query
        * @params {Ol.coordinate} coordinate
        * Get FeatureInfo from WMS queriable layer (only if format of response is XML/GML/HTML). Use hs.query.service_getwmsfeatureinfo service for request and parsing response.
        */
    this.queryWmsLayer = function (layer, coordinate) {
      if (isLayerWmsQueryable(layer)) {
        const source = layer.getSource();
        const map = OlMap.map;
        const viewResolution = map.getView().getResolution();
        let url = source.getFeatureInfoUrl(
          coordinate, viewResolution, source.getProjection() ? source.getProjection() : map.getView().getProjection(), {
            'INFO_FORMAT': source.getParams().INFO_FORMAT
          });
        if (angular.isDefined(layer.get('featureInfoLang')) && angular.isDefined(layer.get('featureInfoLang')[languageService.language])) {
          url = url.replace(source.getUrl(), layer.get('featureInfoLang')[languageService.language]);
        }
        if (url) {
          if (console) {
            console.log(url);
          }

          if (source.getParams().INFO_FORMAT.indexOf('xml') > 0 || source.getParams().INFO_FORMAT.indexOf('html') > 0 || source.getParams().INFO_FORMAT.indexOf('gml') > 0) {
            me.infoCounter++;
            me.request(url, source.getParams().INFO_FORMAT, coordinate, layer);
          }
        }
      }
    };

    function isLayerWmsQueryable(layer) {
      if (!layer.getVisible()) {
        return false;
      }
      if (utils.instOf(layer, Tile) &&
                utils.instOf(layer.getSource(), TileWMS) &&
                layer.getSource().getParams().INFO_FORMAT) {
        return true;
      }
      if (utils.instOf(layer, ImageLayer) &&
                utils.instOf(layer.getSource(), ImageWMS) &&
                layer.getSource().getParams().INFO_FORMAT) {
        return true;
      }
      return false;
    }

    $rootScope.$on('mapQueryStarted', (e, evt) => {
      me.infoCounter = 0;
      OlMap.map.getLayers().forEach((layer) => {
        if (layer.get('queryFilter') != undefined) {
          const filter = layer.get('queryFilter');
          if (filter(OlMap.map, layer, evt.pixel)) {
            me.queryWmsLayer(layer, evt.coordinate);
          }
        } else {
          me.queryWmsLayer(layer, evt.coordinate);
        }
      });
    });

  }];

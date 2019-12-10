import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { Tile, Image as ImageLayer } from 'ol/layer';

export default ['$rootScope', '$http', '$sce', 'hs.query.baseService', 'hs.map.service', 'hs.utils.service', 'Core', 'hs.language.service',
    function ($rootScope, $http, $sce, Base, OlMap, utils, Core, languageService) {
        var me = this;

        me.infoCounter = 0;

        this.request = function (url, infoFormat, coordinate, layer) {
            var req_url = utils.proxify(url, true);
            var reqHash = Base.currentQuery;
            $http({ url: req_url }).
                then(function (response) {
                    if (reqHash != Base.currentQuery) return;
                    me.featureInfoReceived(response.data, infoFormat, url, coordinate, layer);
                }, function (err) {
                    if (reqHash != Base.currentQuery) return;
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
            var updated = false;
            if (infoFormat.indexOf("xml") > 0 || infoFormat.indexOf("gml") > 0) {
                var oParser = new DOMParser();
                var oDOM = oParser.parseFromString(response, "application/xml");
                var doc = oDOM.documentElement;

                var features = doc.querySelectorAll('gml\\:featureMember') ||
                    doc.querySelectorAll('featureMember');
                angular.forEach(features, function (feature) {
                    var layerName = layer.get("title") || layer.get("name");
                    var layers = feature.getElementsByTagName('Layer');
                    angular.forEach(layers, function (layer) {
                        var featureName = layer.attributes[0].nodeValue;
                        var attrs = layer.getElementsByTagName('Attribute');
                        var attributes = [];
                        angular.forEach(attrs, function (attr) {
                            attributes.push({
                                "name": attr.attributes[0].nodeValue,
                                "value": attr.innerHTML
                            });
                            updated = true;
                        });
                        var group = {
                            layer: layerName,
                            name: featureName,
                            attributes: attributes
                        };
                        Base.setData(group, 'features');
                    });
                });
                doc.querySelectorAll("featureMember").forEach(function ($this) {
                    var feature = $this.firstChild;
                    var group = {
                        name: "Feature",
                        attributes: []
                    };

                    for (var attribute in feature.children) {
                        if (feature.children[attribute].childElementCount == 0) {
                            group.attributes.push({
                                "name": feature.children[attribute].localName,
                                "value": feature.children[attribute].innerHTML
                            });
                            updated = true;
                        }
                    }
                    if (updated) Base.setData(group, 'features');
                });
                doc.querySelectorAll("msGMLOutput").forEach(function ($this) {
                    for (var layer_i in $this.children) {
                        var layer = $this.children[layer_i];
                        var layer_name = "";
                        if (typeof layer.children == 'undefined') continue;
                        for (var feature_i = 0; feature_i < layer.children.length; feature_i++) {
                            var feature = layer.children[feature_i];
                            if (feature.nodeName == "gml:name") {
                                layer_name = feature.innerHTML;
                            } else {
                                var group = {
                                    name: layer_name + " Feature",
                                    attributes: []
                                };

                                for (var attribute in feature.children) {
                                    if (feature.children[attribute].childElementCount == 0) {
                                        group.attributes.push({
                                            "name": feature.children[attribute].localName,
                                            "value": feature.children[attribute].innerHTML
                                        });
                                        updated = true;
                                    }
                                }
                                if (updated) Base.setData(group, 'features');
                            }

                        }
                    }
                });
            }
            if (infoFormat.indexOf("html") > 0) {
                if (response.length <= 1) return;
                if(layer.get('getFeatureInfoTarget') == 'info-panel'){
                    Base.pushFeatureInfoHtml(response);
                } else {
                    Base.fillIframeAndResize(Base.getInvisiblePopup(), response, true);
                    if (layer.get('popupClass') != undefined) 
                        Base.popupClassname = "ol-popup " + layer.get('popupClass');
                }
            }
            me.infoCounter--;
            if (me.infoCounter === 0) {
                queriesCollected(coordinate);
            }
        };

        function queriesCollected(coordinate) {
            var invisiblePopup = Base.getInvisiblePopup();
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
                var source = layer.getSource();
                var map = OlMap.map;
                var viewResolution = map.getView().getResolution();
                var url = source.getFeatureInfoUrl(
                    coordinate, viewResolution, source.getProjection() ? source.getProjection() : map.getView().getProjection(), {
                        'INFO_FORMAT': source.getParams().INFO_FORMAT
                    });
                if (angular.isDefined(layer.get('featureInfoLang')) && angular.isDefined(layer.get('featureInfoLang')[languageService.language])) {
                    url = url.replace(source.getUrl(), layer.get('featureInfoLang')[languageService.language]);
                }
                if (url) {
                    if (console) console.log(url);

                    if (source.getParams().INFO_FORMAT.indexOf('xml') > 0 || source.getParams().INFO_FORMAT.indexOf('html') > 0 || source.getParams().INFO_FORMAT.indexOf('gml') > 0) {
                        me.infoCounter++;
                        me.request(url, source.getParams().INFO_FORMAT, coordinate, layer);
                    }
                }
            }
        };

        function isLayerWmsQueryable(layer) {
            if (!layer.getVisible()) return false;
            if (utils.instOf(layer, Tile) &&
                utils.instOf(layer.getSource(), TileWMS) &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            if (utils.instOf(layer, ImageLayer) &&
                utils.instOf(layer.getSource(), ImageWMS) &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            return false;
        }

        $rootScope.$on('mapQueryStarted', function (e, evt) {
            me.infoCounter = 0;
            OlMap.map.getLayers().forEach(function (layer) {
                if (layer.get('queryFilter') != undefined) {
                    var filter = layer.get('queryFilter');
                    if (filter(OlMap.map, layer, evt.pixel)) me.queryWmsLayer(layer, evt.coordinate);
                }
                else me.queryWmsLayer(layer, evt.coordinate);
            });
        });

    }]
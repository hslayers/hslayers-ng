import { WMSCapabilities } from 'ol/format';
import 'components/utils/utils.module';
import { Tile, Image as ImageLayer } from 'ol/layer';
import { TileWMS } from 'ol/source';
import { ImageWMS } from 'ol/source';
import { Attribution } from 'ol/control.js';
import { getPreferedFormat } from '../../../common/format-utils';
import '../../../common/get-capabilities.module';
import { addAnchors } from '../../../common/attribution-utils';
import 'angular-cookies';

export default ['$rootScope', 'hs.map.service', 'hs.wms.getCapabilitiesService',
    'Core', 'hs.dimensionService', '$timeout', 'hs.layout.service',
    function ($rootScope, OlMap, WmsCapsService, Core, dimensionService, $timeout, layoutService) {
        var me = this;

        this.data = {
            useResampling: false,
            useTiles: true,
            mapProjection: undefined,
            registerMetadata: true,
            tileSize: 512
        };

        function fillProjections(caps, response) {
            if (angular.isDefined(caps.Capability.Layer.CRS)) {
                me.data.srss = caps.Capability.Layer.CRS;
            } else {
                var oParser = new DOMParser();
                var oDOM = oParser.parseFromString(response, "application/xml");
                var doc = oDOM.documentElement;
                doc.querySelectorAll('Capability>Layer>CRS').forEach(function (srs) {
                    me.data.srss.push(srs.innerHTML);
                });
            }
        }

        this.capabilitiesReceived = function (response, layerToSelect) {
            try {
                var parser = new WMSCapabilities();
                var caps = parser.read(response);
                me.data.mapProjection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                me.data.title = caps.Service.Title;
                me.data.description = addAnchors(caps.Service.Abstract);
                me.data.version = caps.Version || caps.version;
                me.data.image_formats = caps.Capability.Request.GetMap.Format;
                me.data.query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
                me.data.exceptions = caps.Capability.Exception;
                me.data.srss = [];
                fillProjections(caps, response);
                //TODO: WHY?
                if (me.data.srss.indexOf('CRS:84') > -1) me.data.srss.splice(me.data.srss.indexOf('CRS:84'), 1);

                if (WmsCapsService.currentProjectionSupported(me.data.srss))
                    me.data.srs = me.data.srss.indexOf(OlMap.map.getView().getProjection().getCode()) > -1 ? OlMap.map.getView().getProjection().getCode() : OlMap.map.getView().getProjection().getCode().toLowerCase();
                else if (me.data.srss.indexOf('EPSG:4326') > -1) {
                    me.data.srs = 'EPSG:4326';
                } else
                    me.data.srs = me.data.srss[0];
                me.srsChanged();
                if (Array.isArray(caps.Capability.Layer))
                    me.data.services = caps.Capability.Layer;
                else if (typeof caps.Capability.Layer == 'object')
                    me.data.services = [caps.Capability.Layer];

                selectLayerByName(layerToSelect);

                dimensionService.fillDimensionValues(caps.Capability.Layer);

                me.data.getMapUrl = caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
                me.data.image_format = getPreferedFormat(me.data.image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
                me.data.query_format = getPreferedFormat(me.data.query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);
                $rootScope.$broadcast('wmsCapsParsed');
            }
            catch (e) {
                $rootScope.$broadcast('wmsCapsParseError', e);
            }
        }

        function selectLayerByName(layerToSelect) {
            if (layerToSelect)
                me.data.services.forEach(service => {
                    service.Layer.forEach(layer => {
                        if (layer.Name == layerToSelect) layer.checked = true;
                        $timeout(() => {
                            const id = `hs-add-layer-${layer.Name}`;
                            const el = document.getElementById(id);
                            if (el) el.scrollIntoView();
                        }, 1000)
                    })
                })
        }

        me.srsChanged = function () {
            me.data.resample_warning = !WmsCapsService.currentProjectionSupported([me.data.srs]);
            if (!$rootScope.$$phase) $rootScope.$digest();
        }

        /**
         * @function addLayers
         * @memberOf add-layers-wms.controller
         * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
         * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
         */
        me.addLayers = function (checked) {
            var recurse = function (layer) {
                if (!checked || layer.checked) {
                    if (typeof layer.Layer === 'undefined') {
                        addLayer(
                            layer,
                            layer.Title.replace(/\//g, "&#47;"),
                            me.data.path,
                            me.data.image_format,
                            me.data.query_format,
                            me.data.tile_size,
                            me.data.srs,
                            getSublayerNames(layer)
                        );
                    } else {
                        var clone = {};
                        angular.copy(layer, clone);
                        delete clone.Layer;
                        addLayer(
                            layer,
                            layer.Title.replace(/\//g, "&#47;"),
                            me.data.path,
                            me.data.image_format,
                            me.data.query_format,
                            me.data.tile_size,
                            me.data.srs,
                            getSublayerNames(layer)
                        );
                    }
                }


                angular.forEach(layer.Layer, function (sublayer) {
                    recurse(sublayer)
                })
            }
            angular.forEach(me.data.services, function (layer) {
                recurse(layer)
            });
            layoutService.setMainPanel('layermanager');
        }

        function getSublayerNames(service) {
            if (service.Layer) {
                return service.Layer.map(l => {
                    let tmp = {};
                    if (l.Name) tmp.name = l.Name;
                    if (l.Title) tmp.title = l.Title;
                    if (l.Layer) tmp.children = getSublayerNames(l);
                    return tmp
                })
            } else return []
        }

        //TODO all dimension related things need to be refactored into seperate module
        me.getDimensionValues = dimensionService.getDimensionValues

        me.hasNestedLayers = function (layer) {
            if (angular.isUndefined(layer)) return false;
            return angular.isDefined(layer.Layer);
        };



        /**
         * @function addLayer
         * @memberOf add-layers-wms.controller
         * @param {Object} layer capabilities layer object
         * @param {String} layerName layer name in the map
         * @param {String} path Path name
         * @param {String} imageFormat
         * @param {String} queryFormat
         * @param {OpenLayers.Size} tileSize
         * @param {OpenLayers.Projection} crs of the layer
         * @description Add selected layer to map
         */
        function addLayer(layer, layerName, path, imageFormat, queryFormat, tileSize, crs, subLayers) {
            var attributions = [];
            if (layer.Attribution) {
                attributions = [new Attribution({
                    html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                })]
            }
            var layer_class = Tile;
            var source_class = TileWMS;

            if (!me.data.useTiles) {
                layer_class = ImageLayer;
                source_class = ImageWMS;
            }

            var boundingbox = layer.BoundingBox;
            if (angular.isDefined(crs)) {
                if (angular.isDefined(layer.EX_GeographicBoundingBox)) {
                    boundingbox = layer.EX_GeographicBoundingBox;
                }
            } else {
                if (me.data.map_projection != srs) {
                    boundingbox = layer.LatLonBoundingBox;
                }
            }
            var dimensions = {}

            angular.forEach(layer.Dimension, function (val) {
                dimensions[val.name] = val;
            });

            var legends = [];
            if (layer.Style && layer.Style[0].LegendURL) {
                legends.push(layer.Style[0].LegendURL[0].OnlineResource);
            }
            var styles = undefined;
            if (layer.styleSelected)
                styles = layer.styleSelected;
            else
                styles = layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : 'default'
            var source = new source_class({
                url: me.data.getMapUrl,
                attributions,
                projection: me.data.crs || me.data.srs,
                params: Object.assign({
                    LAYERS: layer.Name || layer.Layer[0].Name,
                    INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                    FORMAT: imageFormat,
                    FROMCRS: me.data.srs,
                    VERSION: me.data.version,
                    STYLES: styles
                }, dimensionService.paramsFromDimensions(layer)),
                crossOrigin: 'anonymous'
            });
            var new_layer = new layer_class({
                title: layerName,
                source,
                minResolution: layer.MinScaleDenominator,
                maxResolution: layer.MaxScaleDenominator,
                saveState: true,
                removable: true,
                abstract: layer.Abstract,
                MetadataURL: layer.MetadataURL,
                BoundingBox: boundingbox,
                path,
                dimensions: dimensions,
                legends: legends,
                subLayers: subLayers
            });
            OlMap.proxifyLayerLoader(new_layer, me.data.useTiles);
            OlMap.map.addLayer(new_layer);
        }

        /**
         * Add service and its layers to project TODO
         * @memberof hs.addLayersWms.service_layer_producer
         * @function addService
         * @param {String} url Service url
         * @param {} box TODO
         */
        me.addService = function (url, box) {
            WmsCapsService.requestGetCapabilities(url).then(function (resp) {
                var ol_layers = WmsCapsService.service2layers(resp);
                angular.forEach(ol_layers, function () {
                    if (typeof box != 'undefined') box.get('layers').push(me);
                    OlMap.map.addLayer(me);
                });
            })
        }

        return me;
    }];

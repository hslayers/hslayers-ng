import 'components/utils/utils.module';
import { Tile } from 'ol/layer';
import { TileArcGISRest } from 'ol/source';
import { Attribution } from 'ol/control.js';
import { getPreferedFormat } from '../../../common/format-utils';
import '../../../common/get-capabilities.module';
import { addAnchors } from '../../../common/attribution-utils';
import 'angular-cookies';

export default ['$rootScope', 'hs.map.service', 'hs.arcgis.getCapabilitiesService',
    'Core', 'hs.dimensionService', '$timeout', 'hs.layout.service',
    function ($rootScope, OlMap, ArcgisCapsService, Core, dimensionService, $timeout, layoutService) {
        var me = this;

        this.data = {
            useResampling: false,
            useTiles: true,
            mapProjection: undefined,
            registerMetadata: true,
            tileSize: 512
        };

        this.capabilitiesReceived = function (response, layerToSelect) {
            try {
                var caps = response;
                me.data.mapProjection = OlMap.map.getView().getProjection().getCode().toUpperCase();
                me.data.title = caps.mapName;
                me.data.description = addAnchors(caps.description);
                me.data.version = caps.currentVersion;
                me.data.image_formats = caps.supportedImageFormatTypes.split(',');
                me.data.query_formats = (caps.supportedQueryFormats ? caps.supportedQueryFormats.split(',') : []);
                me.data.srss = [caps.spatialReference.wkid];
                me.data.services = caps.layers;
                selectLayerByName(layerToSelect);

                me.data.image_format = getPreferedFormat(me.data.image_formats, ["PNG32", "PNG", "GIF", "JPG"]);
                me.data.query_format = getPreferedFormat(me.data.query_formats, ["geoJSON","JSON"]);
                $rootScope.$broadcast('arcgisCapsParsed');
            }
            catch (e) {
                $rootScope.$broadcast('arcgisCapsParseError', e);
            }
        }

        function selectLayerByName(layerToSelect) {
            if (layerToSelect)
                me.data.services.forEach(service => {
                    service.Layer.forEach(layer => {
                        if (layer.name == layerToSelect) layer.checked = true;
                        $timeout(() => {
                            const id = `hs-add-layer-${layer.name}`;
                            const el = document.getElementById(id);
                            if (el) el.scrollIntoView();
                        }, 1000)
                    })
                })
        }

        me.srsChanged = function () {
            me.data.resample_warning = !ArcgisCapsService.currentProjectionSupported([me.data.srs]);
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
                            layer.name.replace(/\//g, "&#47;"),
                            me.data.path,
                            me.data.image_format,
                            me.data.query_format,
                            getSublayerNames(layer)
                        );
                    } else {
                        var clone = {};
                        angular.copy(layer, clone);
                        delete clone.Layer;
                        addLayer(
                            layer,
                            layer.name.replace(/\//g, "&#47;"),
                            me.data.path,
                            me.data.image_format,
                            me.data.query_format,
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
            if (service.layerToSelect) {
                return service.layers.map(l => {
                    let tmp = {};
                    if (l.name) tmp.name = l.name;
                    if (l.layer) tmp.children = getSublayerNames(l);
                    return tmp
                })
            } else return []
        }

        //TODO all dimension related things need to be refactored into seperate module
        me.getDimensionValues = dimensionService.getDimensionValues

        me.hasNestedLayers = function (layer) {
            if (angular.isUndefined(layer)) return false;
            return angular.isDefined(layer.layer);
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
            var source_class = TileArcGISRest;

            angular.forEach(layer.Dimension, function (val) {
                dimensions[val.name] = val;
            });

            var legends = [];
            if (layer.Style && layer.Style[0].LegendURL) {
                legends.push(layer.Style[0].LegendURL[0].OnlineResource);
            }
            var source = new source_class({
                url: me.data.getMapUrl,
                attributions,
                //projection: me.data.crs || me.data.srs,
                params: Object.assign({
                    LAYERS: `show:${layer.id}`,
                    INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                    FORMAT: imageFormat
                }, {}),
                crossOrigin: 'anonymous'
            });
            var new_layer = new layer_class({
                title: layerName,
                source,
                //minResolution: layer.minScale,
                //maxResolution: layer.maxScale,
                saveState: true,
                removable: true,
                path
            });
            //OlMap.proxifyLayerLoader(new_layer, me.data.useTiles);
            OlMap.map.addLayer(new_layer);
        }

        /**
         * Add service and its layers to project TODO
         * @memberof hs.addLayersArcgis.service_layer_producer
         * @function addService
         * @param {String} url Service url
         * @param {} box TODO
         */
        me.addService = function (url, box) {
            ArcgisCapsService.requestGetCapabilities(url).then(function (resp) {
                var ol_layers = ArcgisCapsService.service2layers(resp);
                angular.forEach(ol_layers, function () {
                    if (typeof box != 'undefined') box.get('layers').push(me);
                    OlMap.map.addLayer(me);
                });
            })
        }

        return me;
    }];

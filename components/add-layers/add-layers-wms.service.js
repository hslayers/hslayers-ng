import { WMSCapabilities } from 'ol/format';
import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';
import { Tile, Image as ImageLayer } from 'ol/layer';
import { TileWMS } from 'ol/source';
import { ImageWMS } from 'ol/source';
import { Attribution } from 'ol/control.js';
import { getPreferedFormat } from '../../common/format-utils';
import { addAnchors } from '../../common/attribution-utils';

export default ['$rootScope', 'hs.map.service', 'hs.wms.getCapabilitiesService', 'Core', function ($rootScope, OlMap, WmsCapsService, Core) {
    var me = this;

    this.data = {
        useResampling: false,
        useTiles: true,
        mapProjection: undefined,
        registerMetadata: true,
        tileSize: 512
    };

    this.capabilitiesReceived = function (response) {
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
            if (angular.isDefined(caps.Capability.Layer.CRS)) {
                me.data.srss = caps.Capability.Layer.CRS;
            } else {
                $("Capability>Layer>SRS", response).each(function () {
                    me.data.srss.push(this.innerHTML);
                });
            }
            if (me.data.srss.indexOf('CRS:84') > -1) me.data.srss.splice(me.data.srss.indexOf('CRS:84'), 1);

            if (WmsCapsService.currentProjectionSupported(me.data.srss))
                me.data.srs = me.data.srss.indexOf(OlMap.map.getView().getProjection().getCode()) > -1 ? OlMap.map.getView().getProjection().getCode() : OlMap.map.getView().getProjection().getCode().toLowerCase();
            else if (me.data.srss.indexOf('EPSG:4326') > -1) {
                me.data.srs = 'EPSG:4326';
            } else
                me.data.srs = me.data.srss[0];
            me.srsChanged();
            me.data.services = caps.Capability.Layer;

            fillDimensionValues(caps.Capability.Layer);

            me.data.getMapUrl = caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
            me.data.image_format = getPreferedFormat(me.data.image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
            me.data.query_format = getPreferedFormat(me.data.query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);
            $rootScope.$broadcast('wmsCapsParsed');
        }
        catch (e) {
            $rootScope.$broadcast('wmsCapsParseError', e);
        }
    }

    function fillDimensionValues(layer) {
        angular.forEach(layer.Layer, function (layer) {
            if (me.hasNestedLayers(layer)) {
                fillDimensionValues(layer);
            }
            angular.forEach(layer.Dimension, function (dimension) {
                dimension.values = me.getDimensionValues(dimension)
            })
        })
    }

    $rootScope.$on('ows.capabilities_received', function (event, response) {
        me.capabilitiesReceived(response.data);
    });

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
                        me.data.folder_name,
                        me.data.image_format,
                        me.data.query_format,
                        me.data.single_tile,
                        me.data.tile_size,
                        me.data.srs
                    );
                } else {
                    var clone = {};
                    angular.copy(layer, clone);
                    delete clone.Layer;
                    addLayer(
                        layer,
                        layer.Title.replace(/\//g, "&#47;"),
                        me.data.folder_name,
                        me.data.image_format,
                        me.data.query_format,
                        me.data.single_tile,
                        me.data.tile_size,
                        me.data.srs
                    );
                }
            }


            angular.forEach(layer.Layer, function (sublayer) {
                recurse(sublayer)
            })
        }
        angular.forEach(me.data.services.Layer, function (layer) {
            recurse(layer)
        });
        Core.setMainPanel('layermanager');
    }

    function prepareTimeSteps(step_string) {
        var step_array = step_string.split(',');
        var steps = [];
        for (var i = 0; i < step_array.length; i++) {
            if (step_array[i].indexOf('/') == -1) {
                steps.push(new Date(step_array[i]).toISOString());
                //console.log(new Date(step_array[i]).toISOString());
            } else {
                //"2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H"
                var interval_def = step_array[i].split('/');
                var step = momentinterval.interval(interval_def[2]);
                var interval = momentinterval.interval(interval_def[0] + '/' + interval_def[1]);
                while (interval.start() < interval.end()) {
                    //console.log(interval.start().toDate().toISOString());
                    steps.push(interval.start().toDate().toISOString());
                    interval.start(momentinterval.utc(interval.start().toDate()).add(step.period()));
                }
            }
        }
        return steps;
    }

    me.getDimensionValues = function (dimension) {
        if (moment(dimension.default).isValid())
            return prepareTimeSteps(dimension.values)
        else
            return dimension.values.split(',');
    }

    me.hasNestedLayers = function (layer) {
        if (angular.isUndefined(layer)) return false;
        return angular.isDefined(layer.Layer);
    };

    function paramsFromDimensions(layer) {
        var tmp = {};
        angular.forEach(layer.Dimension, function (dimension) {
            if (dimension.value)
                tmp[dimension.name] = dimension.value;
        });
        return tmp;
    }

    /**
     * @function addLayer
     * @memberOf add-layers-wms.controller
     * @param {Object} layer capabilities layer object
     * @param {String} layerName layer name in the map
     * @param {String} folder name
     * @param {String} imageFormat
     * @param {String} queryFormat
     * @param {Boolean} singleTile
     * @param {OpenLayers.Size} tileSize
     * @param {OpenLayers.Projection} crs of the layer
     * @description Add selected layer to map
     */
    function addLayer(layer, layerName, folder, imageFormat, query_format, singleTile, tileSize, crs) {
        var attributions = [];
        if (layer.Attribution) {
            attributions = [new Attribution({
                html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
            })]
        }
        var layer_class = Tile;
        var source_class = TileWMS;

        if (!me.data.use_tiles) {
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
        var new_layer = new layer_class({
            title: layerName,
            source: new source_class({
                url: me.data.getMapUrl,
                attributions: attributions,
                projection: me.data.crs || me.data.srs,
                styles: layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : undefined,
                params: Object.assign({
                    LAYERS: layer.Name,
                    INFO_FORMAT: (layer.queryable ? query_format : undefined),
                    FORMAT: me.data.image_format,
                    FROMCRS: me.data.srs,
                    VERSION: me.data.version
                }, paramsFromDimensions(layer)),
                crossOrigin: 'anonymous'
            }),
            minResolution: layer.MinScaleDenominator,
            maxResolution: layer.MaxScaleDenominator,
            saveState: true,
            removable: true,
            abstract: layer.Abstract,
            MetadataURL: layer.MetadataURL,
            BoundingBox: boundingbox,
            path: me.data.path,
            dimensions: dimensions,
            legends: legends
        });
        OlMap.proxifyLayerLoader(new_layer, me.data.use_tiles);
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

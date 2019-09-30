import ol from 'ol';
import { default as proj4 } from 'proj4';
import moment from 'moment';
import { GeoJSON, KML } from 'ol/format';
import { Tile, Group } from 'ol/layer';
import { TileWMS, WMTS, OSM } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { Vector } from 'ol/source';

var utils;

function MyProxy(proxy, maxResolution) {
    this.proxy = proxy;
    this.maxResolution = maxResolution;
}

function defineProxy(config) {
    MyProxy.prototype.getURL = function (resource) {
        var blank_url = this.proxy + window.location.protocol + '//' + window.location.hostname + window.location.pathname + 'img/blank.png';
        var prefix = this.proxy.indexOf('?') === -1 && this.proxy.indexOf('hsproxy') > -1 ? '?' : '';
        if (this.maxResolution <= 8550) {
            if (resource.indexOf('bbox=0%2C0%2C45') > -1 || resource.indexOf('bbox=0, 45') > -1) {
                return blank_url;
            } else {
                var params = utils.getParamsFromUrl(resource);
                var bbox = params.bbox.split(',');
                var dist = Math.sqrt(Math.pow((bbox[0] - bbox[2]), 2) + Math.pow((bbox[1] - bbox[3]), 2));
                var projection = getProjectFromVersion(params.version, params.srs, params.crs);
                if (projection == 'EPSG:3857') {
                    if (dist > 1000000) {
                        return blank_url;
                    }
                }
                if (projection == 'EPSG:4326') {
                    if (dist > 1) {
                        return blank_url;
                    }
                }
            }
        }
        resource = resource.replaceAll('fromcrs', 'FROMCRS');
        if (resource.indexOf('proxy4ows') > -1) return resource;
        return this.proxy + prefix + (this.proxy.indexOf('hsproxy') > -1 ? encodeURIComponent(resource) : resource);
    };
}

function getProjectFromVersion(version, srs, crs) {
    if (version == '1.1.1') return srs;
    if (version == '1.3.1') return crs;
}

var me = {
    to_be_deleted: [],
    setupEvents() {
        me.$rootScope.$on('layermanager.base_layer_visible_changed', function (event, data, b) {
            if (angular.isDefined(data) && angular.isDefined(data.type) && data.type == 'terrain') {
                if (data.url == 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles') {
                    var terrain_provider = Cesium.createWorldTerrain(me.config.createWorldTerrainOptions);
                    me.viewer.terrainProvider = terrain_provider;
                } else {
                    me.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
                        url: data.url
                    });
                }
            }
        });

        setTimeout(function () {
            me.repopulateLayers(null);
            me.hs_cesium.broadcastLayerList();
        }, 3500);

        me.hs_map.map.getLayers().on('add', function (e) {
            var lyr = e.element;
            me.processOlLayer(lyr);
        })

    },

    /**
     * @ngdoc method
     * @name hs.cesium.service#repopulateLayers
     * @public
     * @param {object} visible_layers List of layers, which should be visible. 
     * @description Add all layers from app config (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
     */
    repopulateLayers(visible_layers) {
        if(me.viewer.isDestroyed()) return;
        if (angular.isDefined(me.config.default_layers)) {
            angular.forEach(me.config.default_layers, me.processOlLayer);
        }
        if (angular.isDefined(me.config.box_layers)) {
            angular.forEach(me.config.box_layers, me.processOlLayer);
        }
        //Some layers might be loaded from cookies before cesium service was called
        angular.forEach(me.hs_map.map.getLayers(), function (lyr) {
            if (angular.isUndefined(lyr.cesium_layer))
                me.processOlLayer(lyr);
        });
    },

    init: function (viewer, hs_map, hs_cesium, $rootScope, config, _utils) {
        me.viewer = viewer;
        me.hs_map = hs_map;
        me.hs_cesium = hs_cesium;
        me.$rootScope = $rootScope;
        me.config = config;
        defineProxy(config);
        me.setupEvents();
        utils = _utils;
    },

    serializeVectorLayerToGeoJson(ol_source) {
        var f = new GeoJSON();
        //console.log('start serialize',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        var features = ol_source.getFeatures();
        features.forEach(function (feature) {
            if (typeof ol_source.cesium_layer.entities.getById(feature.getId()) != 'undefined') {
                features.splice(features.indexOf(feature), 1);
            } else {
                //console.log('New feadure', feature.getId())
            }
        });
        //console.log('start removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        var to_remove = [];
        ol_source.cesium_layer.entities.values.forEach(function (entity) {
            if (ol_source.getFeatureById(entity.id) == null) {
                to_remove.push(entity.id);
            }
        })
        //console.log('removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        while (to_remove.length > 0) {
            var id = to_remove.pop();
            //console.log('Didnt find OL feature ', id);
            ol_source.cesium_layer.entities.removeById(id);
        }
        //console.log('revoved. serializing',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        var json = f.writeFeaturesObject(features);
        //console.log('done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        //ol_source.cesium_layer.entities.removeAll();
        if (me.hs_map.map.getView().getProjection().getCode() == 'EPSG:3857')
            json.crs = {
                type: "name",
                properties: {
                    name: "EPSG:3857"
                }
            }
        return json;
    },

    linkOlLayerToCesiumLayer(ol_layer, cesium_layer) {
        ol_layer.cesium_layer = cesium_layer;
        cesium_layer.ol_layer = ol_layer;
        ol_layer.on('change:visible', function (e) {
            e.target.cesium_layer.show = ol_layer.getVisible();
        })
        ol_layer.on('change:opacity', function (e) {
            e.target.cesium_layer.alpha = parseFloat(ol_layer.getOpacity());
        })
    },

    linkOlSourceToCesiumDatasource(ol_source, cesium_layer) {
        ol_source.cesium_layer = cesium_layer;
        me.syncFeatures(ol_source);
        ol_source.on('features:loaded', function (e) {
            if (e.target.cesium_layer) {
                me.syncFeatures(e.target);
            }
        })
    },

    syncFeatures(ol_source) {
        var tmp_source = new Cesium.GeoJsonDataSource('tmp');
        Cesium.GeoJsonDataSource.crsNames['EPSG:3857'] = function (coordinates) {

            var firstProjection = 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
            var secondProjection = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

            var xa = coordinates[0];
            var ya = coordinates[1];

            var newCoordinates = proj4(firstProjection, secondProjection, [xa, ya]);
            return Cesium.Cartesian3.fromDegrees(newCoordinates[0], newCoordinates[1], 0);

        }
        //console.log('loading to cesium',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        var promise = tmp_source.load(me.serializeVectorLayerToGeoJson(ol_source), {
            camera: me.viewer.scene.camera,
            canvas: me.viewer.scene.canvas,
            clampToGround: true
        });
        promise.then(function (source) {
            //console.log('loaded in temp.',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
            source.entities.values.forEach(function (entity) {
                try {
                    if (typeof ol_source.cesium_layer.entities.getById(entity.id) == 'undefined') {
                        //console.log('Adding', entity.id);
                        ol_source.cesium_layer.entities.add(entity);
                    }
                } catch (ex) {
                    if (console) console.error(ex.toString())
                }
            })
            //console.log('added to real layer',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
            ol_source.cesiumStyler(ol_source.cesium_layer)
            //console.log('styling done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
        })
    },

    processOlLayer(lyr) {
        if (utils.instOf(lyr, Group)) {
            angular.forEach(lyr.layers, function (sub_lyr) {
                me.processOlLayer(sub_lyr);
            })
        } else {
            lyr.setVisible(me.hs_map.isLayerVisible(lyr, me.hs_map.visible_layers) || lyr.getVisible());
            lyr.manuallyAdded = false;
            if (utils.instOf(lyr.getSource(), ImageWMS))
                me.hs_map.proxifyLayerLoader(lyr, false);
            if (utils.instOf(lyr.getSource(), TileWMS))
                me.hs_map.proxifyLayerLoader(lyr, true);
            var cesium_layer = me.convertOlToCesiumProvider(lyr);
            if (angular.isDefined(cesium_layer)) {
                if (utils.instOf(cesium_layer, Cesium.ImageryLayer)) {
                    me.linkOlLayerToCesiumLayer(lyr, cesium_layer);
                    me.viewer.imageryLayers.add(cesium_layer);
                } else {
                    me.viewer.dataSources.add(cesium_layer);
                    if (lyr.get('title') != 'Point clicked') {
                        me.linkOlSourceToCesiumDatasource(lyr.getSource(), cesium_layer);
                    }
                }
            }
        }
    },

    convertOlToCesiumProvider(ol_lyr) {

        if (utils.instOf(ol_lyr.getSource(), OSM)) {
            return new Cesium.ImageryLayer(Cesium.createOpenStreetMapImageryProvider(), {
                show: ol_lyr.getVisible(),
                minimumTerrainLevel: ol_lyr.minimumTerrainLevel || 15
            });
        } else if (utils.instOf(ol_lyr.getSource(), TileWMS))
            return me.createTileProvider(ol_lyr);
        else if (utils.instOf(ol_lyr.getSource(), ImageWMS))
            return me.createSingleImageProvider(ol_lyr);
        else if (utils.instOf(ol_lyr.getSource(), Vector))
            return me.createVectorDataSource(ol_lyr);
        else {
            if (console) console.error('Unsupported layer type for layer: ', ol_lyr, 'in Cesium converter');
        }
    },

    createVectorDataSource(ol_lyr) {
        if (angular.isDefined(ol_lyr.getSource().getFormat()) && utils.instOf(ol_lyr.getSource().getFormat(), KML)) {
            return Cesium.KmlDataSource.load(ol_lyr.getSource().getUrl(), {
                camera: viewer.scene.camera,
                canvas: viewer.scene.canvas,
                clampToGround: ol_lyr.getSource().get('clampToGround') || true
            })
        } else {
            var new_source = new Cesium.GeoJsonDataSource(ol_lyr.get('title'));
            ol_lyr.cesium_layer = new_source; //link to cesium layer will be set also for OL layers source object, when this function returns.
            ol_lyr.on('change:visible', function (e) {
                e.target.cesium_layer.show = ol_lyr.getVisible();
            })
            return new_source;
        }
    },

    createTileProvider(ol_lyr) {
        var src = ol_lyr.getSource();
        var params = JSON.parse(JSON.stringify(src.getParams()));
        params.VERSION = params.VERSION || '1.1.1';
        if (params.VERSION.indexOf('1.1.') == 0) params.CRS = 'EPSG:4326';
        if (params.VERSION.indexOf('1.3.') == 0) params.SRS = 'EPSG:4326';
        params.FROMCRS = 'EPSG:4326';
        var prm_cache = {
            url: new Cesium.Resource({
                url: src.getUrls()[0],
                proxy: new MyProxy(me.config.proxyPrefix ?
                    me.config.proxyPrefix :
                    '/cgi-bin/hsproxy.cgi?url=', ol_lyr.getMaxResolution())
            }),
            layers: src.getParams().LAYERS,
            dimensions: ol_lyr.get('dimensions'),
            getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('text', 'text/plain')],
            enablePickFeatures: true,
            parameters: params,
            getFeatureInfoParameters: {
                VERSION: params.VERSION,
                CRS: 'EPSG:4326',
                FROMCRS: 'EPSG:4326'
            },
            minimumTerrainLevel: params.minimumTerrainLevel || 12,
            maximumLevel: params.maximumLevel,
            minimumLevel: params.minimumLevel
        };
        var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(me.removeUnwantedParams(prm_cache, src)), {
            alpha: ol_lyr.getOpacity() || 0.7,
            show: ol_lyr.getVisible()
        });
        tmp.prm_cache = prm_cache;
        return tmp;
    },

    //Same as normal tiled WebMapServiceImageryProvider, but with bigger tileWidth and tileHeight
    createSingleImageProvider(ol_lyr) {
        var src = ol_lyr.getSource();
        var params = Object.assign({}, src.getParams());
        params.VERSION = params.VERSION || '1.1.1';
        if (params.VERSION.indexOf('1.1.') == 0) {
            params.CRS = 'EPSG:4326';
            delete params.SRS;
        }
        if (params.VERSION.indexOf('1.3.') == 0) {
            params.SRS = 'EPSG:4326';
            delete params.CRS;
        }
        params.FROMCRS = 'EPSG:4326';
        var prm_cache = {
            url: new Cesium.Resource({
                url: src.getUrl(),
                proxy: new MyProxy(me.config.proxyPrefix ?
                    me.config.proxyPrefix : '/cgi-bin/hsproxy.cgi?url=', ol_lyr.getMaxResolution())
            }),
            layers: src.getParams().LAYERS,
            dimensions: ol_lyr.get('dimensions'),
            getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('text', 'text/plain')],
            enablePickFeatures: true,
            parameters: params,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            getFeatureInfoParameters: {
                VERSION: params.VERSION,
                CRS: 'EPSG:4326',
                FROMCRS: 'EPSG:4326'
            },
            minimumTerrainLevel: params.minimumTerrainLevel || 12,
            tileWidth: 1024,
            tileHeight: 1024
        };

        var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(me.removeUnwantedParams(prm_cache, src)), {
            alpha: ol_lyr.getOpacity() || 0.7,
            show: ol_lyr.getVisible()
        });
        tmp.prm_cache = prm_cache;
        return tmp;
    },

    removeUnwantedParams(prm_cache, src) {
        if (angular.isDefined(prm_cache.parameters.dimensions)) {
            delete prm_cache.parameters.dimensions;
        }
        return prm_cache;
    },

    changeLayerParam(layer, parameter, new_value) {
        new_value = moment(new_value).isValid() ? moment(new_value).toISOString() : new_value;
        layer.prm_cache.parameters[parameter] = new_value;
        me.to_be_deleted.push(layer);
        var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(layer.prm_cache), {
            alpha: layer.alpha,
            show: layer.show
        });
        tmp.prm_cache = layer.prm_cache;
        me.linkOlLayerToCesiumLayer(layer.ol_layer, tmp);
        me.viewer.imageryLayers.add(tmp);
    },

    removeLayersWithOldParams() {
        while (me.to_be_deleted.length > 0)
            me.viewer.imageryLayers.remove(me.to_be_deleted.pop());
    }

};

export default me;

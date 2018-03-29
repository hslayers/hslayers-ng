define(['ol', 'cesiumjs'],

    function (ol, Cesium) {
        var utils;

        function MyProxy(proxy, maxResolution) {
            this.proxy = proxy;
            this.maxResolution = maxResolution;
        }

        MyProxy.prototype.getURL = function (resource) {
            var blank_url = this.proxy + window.location.protocol + '//' + window.location.hostname + window.location.pathname + hsl_path + 'img/blank.png';
            var prefix = this.proxy.indexOf('?') === -1 ? '?' : '';
            if (this.maxResolution <= 8550) {
                if (resource.indexOf('bbox=0%2C0%2C45') > -1 || resource.indexOf('bbox=0, 45') > -1) {
                    return blank_url;
                } else {
                    var params = utils.getParamsFromUrl(resource);
                    var bbox = params.bbox.split(',');
                    var dist = Math.sqrt(Math.pow((bbox[0] - bbox[2]), 2) + Math.pow((bbox[1] - bbox[3]), 2));
                    if (dist > 1) {
                        return blank_url;
                    }
                }
            }
            resource = resource.replaceAll('fromcrs', 'FROMCRS');
            if (resource.indexOf('proxy4ows') > -1) return resource;
            return this.proxy + prefix + encodeURIComponent(resource);
        };


        var me = {
            setupEvents(){
                me.$rootScope.$on('layermanager.base_layer_visible_changed', function (event, data, b) {
                    if (angular.isDefined(data.type) && data.type == 'terrain') {
                        me.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
                            url: data.url
                        });
                    }
                });

                setTimeout(function () {
                    me.repopulateLayers(null);
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
            repopulateLayers (visible_layers) {
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
                me.setupEvents();
                utils = _utils;
            },

            serializeVectorLayerToGeoJson(ol_source) {
                var f = new ol.format.GeoJSON();
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
                //console.log('loading to cesium',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
                var promise = tmp_source.load(me.serializeVectorLayerToGeoJson(ol_source),
                    {
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
                if (lyr instanceof ol.layer.Group) {
                    angular.forEach(lyr.layers, function (sub_lyr) {
                        me.processOlLayer(sub_lyr);
                    })
                } else {
                    lyr.setVisible(me.hs_map.isLayerVisible(lyr, me.hs_map.visible_layers) || lyr.getVisible());
                    lyr.manuallyAdded = false;
                    if (lyr.getSource() instanceof ol.source.ImageWMS)
                        me.hs_map.proxifyLayerLoader(lyr, false);
                    if (lyr.getSource() instanceof ol.source.TileWMS)
                        me.hs_map.proxifyLayerLoader(lyr, true);
                    var cesium_layer = me.convertOlToCesiumProvider(lyr);
                    if (angular.isDefined(cesium_layer)) {
                        if (cesium_layer instanceof Cesium.ImageryLayer) {
                            me.linkOlLayerToCesiumLayer(lyr, cesium_layer);
                            me.viewer.imageryLayers.add(cesium_layer);
                        } else {
                            me.viewer.dataSources.add(cesium_layer);
                            me.linkOlSourceToCesiumDatasource(lyr.getSource(), cesium_layer);
                        }
                    }
                }
            },

            convertOlToCesiumProvider (ol_lyr) {

                if (ol_lyr.getSource() instanceof ol.source.OSM) {
                    return new Cesium.ImageryLayer(Cesium.createOpenStreetMapImageryProvider(), {
                        show: ol_lyr.getVisible(),
                        minimumTerrainLevel: ol_lyr.minimumTerrainLevel || 15
                    });
                } else if (ol_lyr.getSource() instanceof ol.source.TileWMS)
                    return me.createTileProvider(ol_lyr);
                else if (ol_lyr.getSource() instanceof ol.source.ImageWMS)
                    return me.createSingleImageProvider(ol_lyr);
                else if (ol_lyr.getSource() instanceof ol.source.Vector)
                    return me.createVectorDataSource(ol_lyr);
                else {
                    if (console) console.error('Unsupported layer type for layer: ', ol_lyr, 'in Cesium converter');
                }
            },

            createVectorDataSource (ol_lyr) {
                if (ol_lyr.getSource().getFormat() instanceof ol.format.KML) {
                    return Cesium.KmlDataSource.load(ol_lyr.getSource().getUrl(),
                        {
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

            createTileProvider (ol_lyr) {
                var src = ol_lyr.getSource();
                var params = src.getParams();
                params.VERSION = params.VERSION || '1.1.1';
                if (params.VERSION.indexOf('1.1.') == 0) params.CRS = 'EPSG:4326';
                if (params.VERSION.indexOf('1.3.') == 0) params.SRS = 'EPSG:4326';
                params.FROMCRS = 'EPSG:4326';
                var prm_cache = {
                    url: src.getUrls()[0],
                    layers: src.getParams().LAYERS,
                    possible_times: src.getParams().possible_times,
                    getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('text', 'text/plain')],
                    enablePickFeatures: true,
                    parameters: params,
                    getFeatureInfoParameters: { VERSION: params.VERSION, CRS: 'EPSG:4326', FROMCRS: 'EPSG:4326' },
                    minimumTerrainLevel: params.minimumTerrainLevel || 12,
                    proxy: new MyProxy('/cgi-bin/hsproxy.cgi?url=', ol_lyr.getMaxResolution())
                };
                if (src.getParams().possible_times) {
                    delete src.getParams().possible_times;
                    delete prm_cache.parameters.possible_times;
                }
                var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(prm_cache), {
                    alpha: 0.7,
                    show: ol_lyr.getVisible()
                });
                tmp.prm_cache = prm_cache;
                return tmp;
            },

            //Same as normal tiled WebMapServiceImageryProvider, but with bigger tileWidth and tileHeight
            createSingleImageProvider (ol_lyr) {
                var src = ol_lyr.getSource();
                var params = src.getParams();
                params.VERSION = params.VERSION || '1.1.1';
                if (params.VERSION.indexOf('1.1.') == 0) params.CRS = 'EPSG:4326';
                if (params.VERSION.indexOf('1.3.') == 0) params.SRS = 'EPSG:4326';
                params.FROMCRS = 'EPSG:4326';
                var prm_cache = {
                    url: src.getUrl(),
                    layers: src.getParams().LAYERS,
                    possible_times: src.getParams().possible_times,
                    getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('text', 'text/plain')],
                    enablePickFeatures: true,
                    parameters: params,
                    getFeatureInfoParameters: { VERSION: params.VERSION, CRS: 'EPSG:4326', FROMCRS: 'EPSG:4326' },
                    minimumTerrainLevel: params.minimumTerrainLevel || 12,
                    tileWidth: 1024,
                    tileHeight: 1024,
                    proxy: new MyProxy('/cgi-bin/hsproxy.cgi?url=', ol_lyr.getMaxResolution())
                };
                prm_cache.parameters.TEST = 1;
                if (angular.isDefined(src.getParams().possible_times)) {
                    delete src.getParams().possible_times;
                    delete prm_cache.parameters.possible_times;
                }
                var tmp = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider(prm_cache), {
                    alpha: 0.7,
                    show: ol_lyr.getVisible()
                });
                tmp.prm_cache = prm_cache;
                return tmp;
            }

        };
        return me
    }
)
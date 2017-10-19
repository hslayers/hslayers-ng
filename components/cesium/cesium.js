
require.config({
    paths: {
        hs_cesium_camera: hsl_path + 'components/cesium/camera' + hslMin,
    }
})

/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 */
define(['angular', 'cesiumjs', 'permalink', 'ol', 'hs_cesium_camera'], function (angular, Cesium, permalink, ol, HsCsCamera) {
    angular.module('hs.cesium', ['hs'])

        /**
         * @module hs.cesium
         * @name hs.cesium.service
         * @ngdoc service
         * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
         */
        .service('hs.cesium.service', ['config', '$rootScope', 'hs.utils.service', 'hs.map.service', 'hs.layermanager.service', function (config, $rootScope, utils, hs_map, layer_manager_service) {
            var viewer;
            var BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';

            /**
             * @ngdoc method
             * @name hs.cesium.service#init
             * @public
             * @description Initializes Cesium map
             */
            this.init = function () {
                window.CESIUM_BASE_URL = hsl_path + 'bower_components/cesium.js/dist/';
                var terrain_provider = new Cesium.CesiumTerrainProvider({
                    url: config.terrain_provider || 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
                });

                var view = hs_map.map.getView();
                var ol_ext = view.calculateExtent(hs_map.map.getSize());
                var trans_ext = ol.proj.transformExtent(ol_ext, view.getProjection(), 'EPSG:4326');
                var rectangle = Cesium.Rectangle.fromDegrees(trans_ext[0], trans_ext[1], trans_ext[2], trans_ext[3]);

                Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
                Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;
                Cesium.BingMapsApi.defaultKey = BING_KEY;

                var bing = new Cesium.BingMapsImageryProvider({
                    url: 'https://dev.virtualearth.net',
                    key: 'get-yours-at-https://www.bingmapsportal.com/',
                    mapStyle: Cesium.BingMapsStyle.AERIAL
                });

                viewer = new Cesium.Viewer('cesiumContainer', {
                    timeline: false,
                    animation: false,
                    terrainProvider: terrain_provider,
                    terrainExaggeration: config.terrainExaggeration || 1.0,
                    // Use high-res stars downloaded from https://github.com/AnalyticalGraphicsInc/cesium-assets
                    skyBox: new Cesium.SkyBox({
                        sources: {
                            positiveX: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
                            negativeX: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
                            positiveY: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
                            negativeY: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
                            positiveZ: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
                            negativeZ: hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
                        }
                    }),
                    // Show Columbus View map with Web Mercator projection
                    sceneMode: Cesium.SceneMode.SCENE3D,
                    mapProjection: new Cesium.WebMercatorProjection()
                });

                viewer.terrainProvider = terrain_provider;

                me.viewer = viewer;
                HsCsCamera.init(viewer, hs_map);


                setTimeout(function () {
                    me.repopulateLayers(null);
                }, 3500);

                viewer.camera.moveEnd.addEventListener(function (e) {
                    if (!hs_map.visible) {
                        var center = HsCsCamera.getCameraCenterInLngLat();
                        if (center == null) return; //Not looking on the map but in the sky
                        var viewport = HsCsCamera.getViewportPolygon();
                        /* addPointPrimitive(top_left);addPointPrimitive(top_right); addPointPrimitive(bot_left); addPointPrimitive(bot_right); */
                        $rootScope.$broadcast('map.sync_center', center, viewport);
                    }
                });

                function addPointPrimitive(p) {
                    var instance2 = new Cesium.GeometryInstance({
                        geometry: new Cesium.CircleGeometry({
                            center: Cesium.Cartesian3.fromDegrees(p[0], p[1], 300, viewer.scene.globe.ellipsoid),
                            radius: 10,
                            height: 200,
                            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
                        })
                    });

                    viewer.scene.primitives.add(new Cesium.Primitive({
                        geometryInstances: instance2,
                        appearance: new Cesium.EllipsoidSurfaceAppearance({
                            aboveGround: true, material: new Cesium.Material({
                                fabric: {
                                    type: 'Color',
                                    uniforms: {
                                        color: new Cesium.Color(0.0, 0.0, 1.0, 1.0)
                                    }
                                }
                            })
                        })
                    }))
                }

                angular.forEach(config.terrain_providers, function (provider) {
                    provider.type = 'terrain';
                    layer_manager_service.data.terrainlayers.push(provider);
                })

                hs_map.map.getLayers().on('add', function (e) {
                    var lyr = e.element;
                    processOlLayer(lyr);
                })

                $rootScope.$on('map.extent_changed', function (event, data, b) {
                    var view = hs_map.map.getView();
                    if (hs_map.visible) {
                        HsCsCamera.setExtentEqualToOlExtent(view);
                    }
                });

                $rootScope.$on('search.zoom_to_center', function (event, data) {
                    viewer.camera.setView({
                        destination: Cesium.Cartesian3.fromDegrees(data.coordinate[0], data.coordinate[1], 15000.0)
                    });
                })

                $rootScope.$on('layermanager.base_layer_visible_changed', function (event, data, b) {
                    if (angular.isDefined(data.type) && data.type == 'terrain') {
                        viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
                            url: data.url
                        });
                    }
                });

                var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction(function (movement) {
                    var pickRay = viewer.camera.getPickRay(movement.position);
                    var pickedObject = viewer.scene.pick(movement.position);
                    var featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(pickRay, viewer.scene);
                    if (pickedObject && pickedObject.id && pickedObject.id.onclick) {
                        pickedObject.id.onclick(pickedObject.id);
                        return;
                    }
                    if (!Cesium.defined(featuresPromise)) {
                        console.log('No features picked.');
                    } else {

                        Cesium.when(featuresPromise, function (features) {

                            var s = '';
                            if (features.length > 0) {
                                for (var i = 0; i < features.length; i++) {
                                    s = s + features[i].data + '\n';
                                }
                            }

                            var iframe = $('.cesium-infoBox-iframe');
                            setTimeout(function () {
                                $('.cesium-infoBox-description', iframe.contents()).html(s.replaceAll('\n', '<br/>'));
                                iframe.height(200);
                            }, 1000);
                        });
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

                /**
                 * @ngdoc event
                 * @name hs.cesium.service#map.loaded
                 * @eventType broadcast on $rootScope
                 * @description 
                 */
                $rootScope.$broadcast('cesiummap.loaded');
            }

            function serializeVectorLayerToGeoJson(ol_source) {
                var f = new ol.format.GeoJSON();
                var json = f.writeFeaturesObject(ol_source.getFeatures());
                return json;
            }

            function linkOlLayerToCesiumLayer(ol_layer, cesium_layer) {
                ol_layer.cesium_layer = cesium_layer;
                ol_layer.on('change:visible', function (e) {
                    e.target.cesium_layer.show = ol_layer.getVisible();
                })
                ol_layer.on('change:opacity', function (e) {
                    e.target.cesium_layer.alpha = parseFloat(ol_layer.getOpacity());
                })
            }

            function linkOlSourceToCesiumDatasource(ol_source, cesium_layer) {
                ol_source.cesium_layer = cesium_layer;
                syncFeatures(ol_source);
                ol_source.on('features:loaded', function (e) {
                    if (e.target.cesium_layer) {
                        syncFeatures(e.target);
                    }
                })
            }

            function syncFeatures(ol_source) {
                ol_source.cesium_layer.entities.removeAll();
                var promise = ol_source.cesium_layer.load(serializeVectorLayerToGeoJson(ol_source),
                    {
                        camera: viewer.scene.camera,
                        canvas: viewer.scene.canvas,
                        clampToGround: true
                    });
                promise.then(ol_source.cesiumStyler)
            }

            function processOlLayer(lyr) {
                if (lyr instanceof ol.layer.Group) {
                    angular.forEach(lyr.layers, function (sub_lyr) {
                        processOlLayer(sub_lyr);
                    })
                } else {
                    lyr.setVisible(hs_map.isLayerVisible(lyr, hs_map.visible_layers) || lyr.getVisible());
                    lyr.manuallyAdded = false;
                    if (lyr.getSource() instanceof ol.source.ImageWMS)
                        hs_map.proxifyLayerLoader(lyr, false);
                    if (lyr.getSource() instanceof ol.source.TileWMS)
                        hs_map.proxifyLayerLoader(lyr, true);
                    var cesium_layer = me.convertOlToCesiumProvider(lyr);
                    if (angular.isDefined(cesium_layer)) {
                        if (cesium_layer instanceof Cesium.ImageryLayer) {
                            linkOlLayerToCesiumLayer(lyr, cesium_layer);
                            me.viewer.imageryLayers.add(cesium_layer);
                        } else {
                            me.viewer.dataSources.add(cesium_layer);
                            linkOlSourceToCesiumDatasource(lyr.getSource(), cesium_layer);
                        }
                    }
                }
            }

            /**
             * @ngdoc method
             * @name hs.cesium.service#repopulateLayers
             * @public
             * @param {object} visible_layers List of layers, which should be visible. 
             * @description Add all layers from app config (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
             */
            this.repopulateLayers = function (visible_layers) {
                if (angular.isDefined(config.default_layers)) {
                    angular.forEach(config.default_layers, processOlLayer);
                }
                if (angular.isDefined(config.box_layers)) {
                    angular.forEach(config.box_layers, processOlLayer);
                }
                //Some layers might be loaded from cookies before cesium service was called
                angular.forEach(hs_map.map.getLayers(), function (lyr) {
                    if (angular.isUndefined(lyr.cesium_layer))
                        processOlLayer(lyr);
                });
            }

            this.convertOlToCesiumProvider = function (ol_lyr) {

                function MyProxy(proxy) {
                    this.proxy = proxy;
                }

                MyProxy.prototype.getURL = function (resource) {
                    var blank_url = this.proxy + window.location.protocol + '//' + window.location.hostname + window.location.pathname + hsl_path + 'img/blank.png';
                    var prefix = this.proxy.indexOf('?') === -1 ? '?' : '';
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
                    resource = resource.replaceAll('fromcrs', 'FROMCRS');
                    if (resource.indexOf('proxy4ows') > -1) return resource;
                    return this.proxy + prefix + encodeURIComponent(resource);
                };


                if (ol_lyr.getSource() instanceof ol.source.OSM) {
                    return new Cesium.ImageryLayer(Cesium.createOpenStreetMapImageryProvider(), {
                        show: ol_lyr.getVisible(),
                        minimumTerrainLevel: ol_lyr.minimumTerrainLevel || 15
                    });
                } else if (ol_lyr.getSource() instanceof ol.source.TileWMS) {
                    var src = ol_lyr.getSource();
                    var params = src.getParams();
                    params.VERSION = '1.1.1';
                    params.CRS = 'EPSG:4326';
                    params.FROMCRS = 'EPSG:4326';
                    return new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider({
                        url: src.getUrls()[0],
                        layers: src.getParams().LAYERS,
                        getFeatureInfoFormats: [new Cesium.GetFeatureInfoFormat('text', 'text/plain')],
                        enablePickFeatures: true,
                        parameters: params,
                        getFeatureInfoParameters: { VERSION: '1.1.1', CRS: 'EPSG:4326', FROMCRS: 'EPSG:4326' },
                        minimumTerrainLevel: params.minimumTerrainLevel || 12,
                        proxy: new MyProxy('/cgi-bin/hsproxy.cgi?url=')
                    }), {
                            alpha: 0.7,
                            show: ol_lyr.getVisible()
                        })
                } else if (ol_lyr.getSource() instanceof ol.source.Vector) {
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
                } else {
                    console.error('Unsupported layer type for layer: ', ol_lyr, 'in Cesium converter');
                }
            }


            this.getCameraCenterInLngLat = HsCsCamera.getCameraCenterInLngLat;

            var me = this;

        }])

        /**
         * @module hs.cesium
         * @name hs.cesium.directive
         * @ngdoc directive
         * @description 
         */
        .directive('hs.cesium.directive', ['Core', function (Core) {
            return {
                templateUrl: hsl_path + 'components/cesium/partials/cesium.html?bust=' + gitsha,
                link: function (scope, element) { }
            };
        }])

        .directive('hs.cesium.toolbarButtonDirective', function () {
            return {
                templateUrl: hsl_path + 'components/cesium/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })

        /**
         * @module hs.cesium
         * @name hs.cesium.controller
         * @ngdoc controller
         * @description 
         */
        .controller('hs.cesium.controller', ['$scope', 'hs.cesium.service', 'config', 'hs.permalink.service_url', 'Core', 'hs.map.service', 'hs.sidebar.service', '$timeout',
            function ($scope, service, config, permalink, Core, hs_map, sidebar_service, $timeout) {

                var map = service.map;

                /**
                 * @ngdoc method
                 * @name hs.cesium.controller#init
                 * @public
                 * @description 
                 */
                $scope.init = function () {
                    service.init();
                }

                /**
                 * @ngdoc method
                 * @name hs.cesium.controller#toggleCesiumMap
                 * @private
                 * @description Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
                 */
                function toggleCesiumMap() {
                    hs_map.visible = !hs_map.visible;
                    if (hs_map.visible) {
                        $timeout(function () {
                            Core.updateMapSize();
                        }, 0)
                    }
                }

                setTimeout(function () {
                    hs_map.visible = false;
                }, 0);

                sidebar_service.extra_buttons.push({
                    title: '3D/2D',
                    icon_class: 'glyphicon glyphicon-globe',
                    click: toggleCesiumMap
                });

                $scope.init();
                $scope.$emit('scope_loaded', "CesiumMap");
            }
        ]);
})

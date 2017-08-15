/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 */
define(['angular', 'cesiumjs', 'permalink', 'ol'], function(angular, Cesium, permalink, ol) {
    angular.module('hs.cesium', ['hs'])

        /**
         * @module hs.cesium
         * @name hs.cesium.service
         * @ngdoc service
         * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
         */
        .service('hs.cesium.service', ['config', '$rootScope', 'hs.utils.service', 'hs.map.service', 'hs.layermanager.service', function(config, $rootScope, utils, hs_map, layer_manager_service) {
            var widget;
            var BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';

            /**
             * @ngdoc method
             * @name hs.cesium.service#init
             * @public
             * @description Initializes Cesium map
             */
            this.init = function() {
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
                    url : 'https://dev.virtualearth.net',
                    key : 'get-yours-at-https://www.bingmapsportal.com/',
                    mapStyle : Cesium.BingMapsStyle.AERIAL
                });
                
                widget = new Cesium.CesiumWidget('cesiumContainer', {
                    terrainProvider: terrain_provider,
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
                
                               
                me.widget = widget;
                
                var instance = new Cesium.GeometryInstance({
                    geometry : new Cesium.RectangleGeometry({
                        rectangle : rectangle,
                        height: 1000,
                        vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
                    })
                });

                widget.scene.primitives.removeAll();
                /*widget.scene.primitives.add(new Cesium.Primitive({
                    geometryInstances : instance,
                    appearance : new Cesium.EllipsoidSurfaceAppearance({aboveGround: true})
                }));*/
                   
                   
                setTimeout(function(){me.repopulateLayers(null);}, 2500);
                
                widget.camera.moveEnd.addEventListener(function(e) {
                    if (!hs_map.visible) {
                        $rootScope.$broadcast('map.sync_center', getCameraCenterInLngLat());
                    }
                });
                
                angular.forEach(config.terrain_providers, function(provider){
                    provider.type = 'terrain';
                    layer_manager_service.data.baselayers.push(provider);
                })
                
                hs_map.map.getLayers().on("add", function(e) {
                    var layer = e.element;
                   
                });
                
                $rootScope.$on('map.extent_changed', function(event, data, b) {
                    var view = hs_map.map.getView();
                    if (hs_map.visible) {
                        setExtentEqualToOlExtent(view);
                    }
                });
                
                $rootScope.$on('search.zoom_to_center', function(event, data) {
                    widget.camera.setView({
                        destination: Cesium.Cartesian3.fromDegrees(data.coordinate[0], data.coordinate[1], 15000.0)
                    });
                })              
                
                $rootScope.$on('layermanager.base_layer_visible_changed', function(event, data, b) {
                   if(angular.isDefined(data.type) && data.type == 'terrain'){
                        widget.terrainProvider = new Cesium.CesiumTerrainProvider({
                            url: data.url
                        });
                   }
                });
                
                

                /**
                 * @ngdoc event
                 * @name hs.cesium.service#map.loaded
                 * @eventType broadcast on $rootScope
                 * @description 
                 */
                $rootScope.$broadcast('cesiummap.loaded');
            }
            
            function linkOlLayerToCesiumLayer(ol_layer, cesium_layer){
                ol_layer.cesium_layer = cesium_layer;
                ol_layer.on('change:visible', function(e) {
                    e.target.cesium_layer.show = ol_layer.getVisible();
                    /*me.widget.terrainProvider = new Cesium.CesiumTerrainProvider({
                        url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
                    })*/
                })
            }
            
            function setExtentEqualToOlExtent(view){
                var ol_ext = view.calculateExtent(hs_map.map.getSize());
                var trans_ext = ol.proj.transformExtent(ol_ext, view.getProjection(), 'EPSG:4326');
                widget.camera.setView({
                    destination: Cesium.Rectangle.fromDegrees(trans_ext[0], trans_ext[1], trans_ext[2], trans_ext[3])
                });
               
                var ray = widget.camera.getPickRay(new Cesium.Cartesian2(widget.canvas.width / 2, widget.canvas.height / 2));
                var positionCartesian3 = widget.scene.globe.pick(ray, widget.scene);
                if(positionCartesian3)
                {
                    /*
                    var instance = new Cesium.GeometryInstance({
                        geometry : new Cesium.RectangleGeometry({
                            rectangle : Cesium.Rectangle.fromDegrees(trans_ext[0], trans_ext[1], trans_ext[2], trans_ext[3]),
                            height: Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3).height,
                            vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
                        })
                    });

                    widget.scene.primitives.removeAll();
                    widget.scene.primitives.add(new Cesium.Primitive({
                        geometryInstances : instance,
                        appearance : new Cesium.EllipsoidSurfaceAppearance({aboveGround: true})
                    })); */
                    widget.camera.moveBackward(Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3).height);
                }
            }

            /**
             * @ngdoc method
             * @name hs.cesium.service#repopulateLayers
             * @public
             * @param {object} visible_layers List of layers, which should be visible. 
             * @description Add all layers from app config (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
             */
            this.repopulateLayers = function(visible_layers) {
                if (angular.isDefined(config.default_layers)) {
                    angular.forEach(config.default_layers, function(lyr) {
                        lyr.setVisible(hs_map.isLayerVisible(lyr, hs_map.visible_layers));
                        lyr.manuallyAdded = false;
                        if (lyr.getSource() instanceof ol.source.ImageWMS)
                            hs_map.proxifyLayerLoader(lyr, false);
                        var cesium_layer = me.convertOlToCesiumProvider(lyr);
                        linkOlLayerToCesiumLayer(lyr, cesium_layer);
                        me.widget.imageryLayers.add(cesium_layer);
                    });
                }
            }

            this.convertOlToCesiumProvider = function(ol_lyr) {
                if (ol_lyr.getSource() instanceof ol.source.OSM) {
                    return new Cesium.ImageryLayer(Cesium.createOpenStreetMapImageryProvider(), {
                        show: ol_lyr.getVisible(),
                        minimumTerrainLevel: ol_lyr.minimumTerrainLevel || 15
                    });
                } else if (ol_lyr.getSource() instanceof ol.source.TileWMS) {
                    var src = ol_lyr.getSource();
                    var params = src.getParams();
                    params.CRS = 'EPSG:4326'; 
                    return new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider({
                        url: src.getUrls()[0],
                        layers: src.getParams().LAYERS,
                        parameters: params,
                        minimumTerrainLevel: params.minimumTerrainLevel || 12,
                        proxy: new Cesium.DefaultProxy('/cgi-bin/hsproxy.cgi?url=')
                    }), {
                        alpha: 0.7,
                        show: ol_lyr.getVisible()
                    })
                }
            }

            /**
             * @ngdoc method
             * @name hs.cesium.service#getCameraCenterInLngLat
             * @private
             * @description Gets the position the camera is pointing to in lon/lat coordinates and resolution as the third array element
             */
            function getCameraCenterInLngLat() {
                var ray = widget.camera.getPickRay(new Cesium.Cartesian2(widget.canvas.width / 2, widget.canvas.height / 2));
                var positionCartesian3 = widget.scene.globe.pick(ray, widget.scene);
                if (positionCartesian3) {
                    var positionCartographic = Cesium.Cartographic.fromCartesian(positionCartesian3);
                    var lngDeg = Cesium.Math.toDegrees(positionCartographic.longitude);
                    var latDeg = Cesium.Math.toDegrees(positionCartographic.latitude);
                    position = [lngDeg, latDeg, calcResolutionForDistance(Cesium.Cartographic.fromCartesian(widget.camera.position).height - positionCartographic.height, latDeg)];
                    return position;
                } else return null;
            }

            /**
             * @ngdoc method
             * @name hs.cesium.service#calcResolutionForDistance
             * @private
             * @description Calculates the resolution for a given distance from the ground and latitude
             */
            function calcResolutionForDistance(distance, latitude) {
                // See the reverse calculation (calcDistanceForResolution_) for details
                const canvas = widget.scene.canvas;
                const fovy = widget.camera.frustum.fovy;
                const metersPerUnit = hs_map.map.getView().getProjection().getMetersPerUnit();

                const visibleMeters = 2 * distance * Math.tan(fovy / 2);
                const relativeCircumference = Math.cos(Math.abs(latitude));
                const visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
                const resolution = visibleMapUnits / canvas.clientHeight;
                return resolution;
            };

            /**
             * @ngdoc method
             * @name hs.cesium.service#calcDistanceForResolution
             * @private
             * @description Calculates the distance from the ground based on resolution and latitude
             */
            function calcDistanceForResolution(resolution, latitude) {
                const canvas = widget.scene.canvas;
                const fovy = widget.camera.frustum.fovy;
                const metersPerUnit = hs_map.map.getView().getProjection().getMetersPerUnit();

                // number of "map units" visible in 2D (vertically)
                const visibleMapUnits = resolution * canvas.clientHeight;

                // The metersPerUnit does not take latitude into account, but it should
                // be lower with increasing latitude -- we have to compensate.
                // In 3D it is not possible to maintain the resolution at more than one point,
                // so it only makes sense to use the latitude of the "target" point.
                const relativeCircumference = Math.cos(Math.abs(latitude));

                // how many meters should be visible in 3D
                const visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

                // distance required to view the calculated length in meters
                //
                //  fovy/2
                //    |\
                //  x | \
                //    |--\
                // visibleMeters/2
                const requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

                // NOTE: This calculation is not absolutely precise, because metersPerUnit
                // is a great simplification. It does not take ellipsoid/terrain into account.

                return requiredDistance;
            };

            this.getCameraCenterInLngLat = getCameraCenterInLngLat;

            var me = this;

        }])

        /**
         * @module hs.cesium
         * @name hs.cesium.directive
         * @ngdoc directive
         * @description 
         */
        .directive('hs.cesium.directive', ['Core', function(Core) {
            return {
                templateUrl: hsl_path + 'components/cesium/partials/cesium.html?bust=' + gitsha,
                link: function(scope, element) {}
            };
        }])

        .directive('hs.cesium.toolbarButtonDirective', function() {
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
            function($scope, service, config, permalink, Core, hs_map, sidebar_service, $timeout) {

                var map = service.map;

                /**
                 * @ngdoc method
                 * @name hs.cesium.controller#init
                 * @public
                 * @description 
                 */
                $scope.init = function() {
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
                        $timeout(function() {
                            Core.updateMapSize();
                        }, 0)
                    }
                }

                setTimeout(function() {
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

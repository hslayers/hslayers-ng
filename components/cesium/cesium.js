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
    .service('hs.cesium.service', ['config', '$rootScope', 'hs.utils.service', 'hs.map.service', function(config, $rootScope, utils, hs_map) {
        var widget;
        
        /**
        * @ngdoc method
        * @name hs.cesium.service#init
        * @public
        * @description Initializes Cesium map
        */
        this.init = function(){
            window.CESIUM_BASE_URL = hsl_path + 'bower_components/cesium.js/dist/';
            
            //Widget with OpenStreetMaps imagery provider and Cesium terrain provider hosted by AGI.
            widget = new Cesium.CesiumWidget('cesiumContainer', {
                imageryProvider : Cesium.createOpenStreetMapImageryProvider(),
                terrainProvider : new Cesium.CesiumTerrainProvider({
                    url : 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
                }),
                // Use high-res stars downloaded from https://github.com/AnalyticalGraphicsInc/cesium-assets
                skyBox : new Cesium.SkyBox({
                    sources : {
                    positiveX : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
                    negativeX : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
                    positiveY : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
                    negativeY : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
                    positiveZ : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
                    negativeZ : hsl_path + 'bower_components/cesium.js/dist/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
                    }
                }),
                // Show Columbus View map with Web Mercator projection
                sceneMode : Cesium.SceneMode.SCENE3D,
                mapProjection : new Cesium.WebMercatorProjection()
            });
                       
            widget.camera.moveEnd.addEventListener(function(e) {
                $rootScope.$broadcast('map.sync_center', getCameraCenterInLngLat());
            });
            
            /**
            * @ngdoc event
            * @name hs.cesium.service#map.loaded
            * @eventType broadcast on $rootScope
            * @description 
            */
            $rootScope.$broadcast('cesiummap.loaded');
        }
        
        /**
        * @ngdoc method
        * @name hs.cesium.service#getCameraCenterInLngLat
        * @private
        * @description Gets the position the camera is pointing to in lon/lat coordinates and resolution as the third array element
        */
        function getCameraCenterInLngLat() {
            var ray = widget.camera.getPickRay(new Cesium.Cartesian2(widget.canvas.width/2, widget.canvas.height/2));
            var positionCartesian3 = widget.scene.globe.pick(ray, widget.scene);
            if(positionCartesian3){
                var positionCartographic = Cesium.Cartographic.fromCartesian(positionCartesian3);
                var lngDeg =  Cesium.Math.toDegrees(positionCartographic.longitude);
                var latDeg =  Cesium.Math.toDegrees(positionCartographic.latitude);
                var carto_position = widget.camera.positionCartographic.clone();
                carto_position.height = 0;
                var carte_position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto_position);
                var _distance = Math.abs(Cesium.Cartesian3.distance(carte_position, widget.camera.position));
                position = [lngDeg, latDeg, calcResolutionForDistance(_distance, latDeg)];
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
                link: function(scope, element) {
            }
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
            function toggleCesiumMap(){
                hs_map.visible = !hs_map.visible;
                if(hs_map.visible) {
                    $timeout(function(){
                    Core.updateMapSize();
                    }, 0)
                }
            }
            
            setTimeout(function(){hs_map.visible = false;}, 0);            
            
            sidebar_service.extra_buttons.push({title:'3D/2D', icon_class: 'glyphicon glyphicon-globe', click: toggleCesiumMap}); 
            
            $scope.init();
            $scope.$emit('scope_loaded', "CesiumMap");
        }
    ]);
})

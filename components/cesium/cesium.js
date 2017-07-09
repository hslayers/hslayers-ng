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
    .service('hs.cesium.service', ['config', '$rootScope', 'hs.utils.service', function(config, $rootScope, utils) {
        
        /**
        * @ngdoc method
        * @name hs.cesium.service#init
        * @public
        * @description Initialization function for HSLayers map object. Initialize map with basic interaction, scale line and watcher for map view changes. When default controller is used, its called automaticaly, otherwise its must be called before other modules dependent on map object are loaded.
        */
        this.init = function(){
            window.CESIUM_BASE_URL = hsl_path + 'bower_components/cesium.js/dist/';
            
            //Widget with OpenStreetMaps imagery provider and Cesium terrain provider hosted by AGI.
            var widget = new Cesium.CesiumWidget('cesiumContainer', {
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
            
            /**
            * @ngdoc event
            * @name hs.cesium.service#map.loaded
            * @eventType broadcast on $rootScope
            * @description 
            */
            $rootScope.$broadcast('cesiummap.loaded');
        }
        
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

    /**
     * @module hs.cesium
     * @name hs.cesium.controller
     * @ngdoc controller
     * @description 
     */
    .controller('hs.cesium.controller', ['$scope', 'hs.cesium.service', 'config', 'hs.permalink.service_url', 'Core',
        function($scope, service, config, permalink, Core) {
            
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

            $scope.init();
            $scope.$emit('scope_loaded', "CesiumMap");
        }
    ]);
})

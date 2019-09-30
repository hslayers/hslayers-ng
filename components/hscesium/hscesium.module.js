import hscesiumService from './hscesium.service';

/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 */
angular.module('hs.cesium', [])

    /**
     * @module hs.cesium
     * @name hs.cesium.service
     * @ngdoc service
     * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
     */
    .service('hs.cesium.service', hscesiumService)

    /**
     * @module hs.cesium
     * @name hs.cesium.directive
     * @ngdoc directive
     * @description 
     */
    .directive('hs.cesium.directive', ['config', 'hs.cesium.service', '$timeout', function (config, service, $timeout) {
        return {
            template: require('components/hscesium/partials/cesium.html'),
            link: function (scope, element) {
                $timeout(() => {
                    service.init();
                })
            }
        };
    }])

    /**
     * @module hs.cesium
     * @name hs.cesium.controller
     * @ngdoc controller
     * @description 
     */
    .controller('hs.cesium.controller', ['$scope', 'hs.cesium.service', 'config', 'hs.permalink.urlService', 'Core', 'hs.map.service', 'hs.sidebar.service', '$timeout', '$rootScope',
        function ($scope, service, config, permalink, Core, hsMap, sidebarService, $timeout, $rootScope) {

            var map = service.map;
            $scope.visible = true;

            /**
             * @ngdoc method
             * @name hs.cesium.controller#toggleCesiumMap
             * @private
             * @description Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
             */
            function toggleCesiumMap() {
                hsMap.visible = !hsMap.visible;
                $scope.visible = !hsMap.visible;
                permalink.updateCustomParams({view: hsMap.visible ? '2d' : '3d'});
                if (hsMap.visible) {
                    service.viewer.destroy();
                    $timeout(function () {
                        Core.updateMapSize();
                    }, 5000)
                } else {
                    service.init();
                }
                $rootScope.$broadcast('map.mode_changed', $scope.visible ? 'cesium' : 'ol');
            }

            var view = permalink.getParamValue('view');
            if (view != '2d' || view == '3d') {
                permalink.updateCustomParams({view: '3d'});
                setTimeout(function () {
                    hsMap.visible = false;
                }, 0);
            } else {
                permalink.updateCustomParams({view: '2d'});
            }

            sidebarService.extraButtons.push({
                title: '3D/2D',
                icon_class: 'icon-globealt',
                click: toggleCesiumMap
            });

            $rootScope.$on('layermanager.dimension_changed', function (e, data) {
                service.dimensionChanged(data.layer, data.dimension)
            });

            $rootScope.$on('Core.mapSizeUpdated', service.resize);
            service.resize();

            $scope.$emit('scope_loaded', "CesiumMap");
        }
    ]);


import hscesiumService from './hscesium.service';

/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 */
angular
  .module('hs.cesium', [])

  /**
   * @module hs.cesium
   * @name HsCesiumService
   * @ngdoc service
   * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
   */
  .factory('HsCesiumService', hscesiumService)

  /**
   * @module hs.cesium
   * @name hs.cesium.directive
   * @ngdoc directive
   * @description
   */
  .directive('hs.cesium.directive', [
    'HsConfig',
    'HsCesiumService',
    '$timeout',
    function (config, service, $timeout) {
      return {
        template: require('components/hscesium/partials/cesium.html'),
        link: function (scope, element) {
          $timeout(() => {
            service.init();
          });
        },
      };
    },
  ])

  /**
   * @module hs.cesium
   * @name HsCesiumController
   * @ngdoc controller
   * @description
   */
  .controller('HsCesiumController', [
    '$scope',
    'HsCesiumService',
    'HsConfig',
    'HsPermalinkUrlService',
    'HsCore',
    'HsMapService',
    'HsSidebarService',
    '$timeout',
    '$rootScope',
    function (
      $scope,
      service,
      config,
      permalink,
      HsCore,
      hsMap,
      sidebarService,
      $timeout,
      $rootScope
    ) {
      const map = service.map;
      $scope.visible = true;

      /**
       * @ngdoc method
       * @name HsCesiumController#toggleCesiumMap
       * @private
       * @description Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
       */
      function toggleCesiumMap() {
        hsMap.visible = !hsMap.visible;
        $scope.visible = !hsMap.visible;
        permalink.updateCustomParams({view: hsMap.visible ? '2d' : '3d'});
        if (hsMap.visible) {
          service.viewer.destroy();
          $timeout(() => {
            HsCore.updateMapSize();
          }, 5000);
        } else {
          service.init();
        }
        $rootScope.$broadcast(
          'map.mode_changed',
          $scope.visible ? 'cesium' : 'ol'
        );
      }

      const view = permalink.getParamValue('view');
      if (view != '2d' || view == '3d') {
        permalink.updateCustomParams({view: '3d'});
        setTimeout(() => {
          hsMap.visible = false;
        }, 0);
      } else {
        permalink.updateCustomParams({view: '2d'});
      }

      sidebarService.extraButtons.push({
        title: '3D/2D',
        icon_class: 'icon-globealt',
        click: toggleCesiumMap,
      });

      $rootScope.$on('layermanager.dimension_changed', (e, data) => {
        service.dimensionChanged(data.layer, data.dimension);
      });

      $rootScope.$on('HsCore.mapSizeUpdated', service.resize);
      service.resize();

      $scope.$emit('scope_loaded', 'CesiumMap');
    },
  ]);

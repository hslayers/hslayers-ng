import * as angular from 'angular';
import {HsCesiumCameraService} from './cesium-camera.service';
import {HsCesiumLayersService} from './cesium-layers.service';
import {HsCesiumService} from './cesium.service';
import {HsCesiumTimeService} from './cesium-time.service';

/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 * @param config
 * @param service
 * @param $timeout
 */
angular
  .module('hs.cesium', [])

  /**
   * @module hs.cesium
   * @name HsCesiumService
   * @ngdoc service
   * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
   */
  .service('HsCesiumService', HsCesiumService)

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium timeline integration with HsLayers
   */
  .service('HsCesiumTimeService', HsCesiumTimeService)

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium and openlayers layers integration
   */
  .service('HsCesiumLayersService', HsCesiumLayersService)

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium and openlayers camera synchronization
   */
  .service('HsCesiumCameraService', HsCesiumCameraService)

  /**
   * @module hs.cesium
   * @name hs.cesium.directive
   * @ngdoc directive
   * @description
   */
  .directive('hs.cesium.directive', (HsCesiumService, $timeout) => {
    'ngInject';
    return {
      template: require('./partials/cesium.html'),
      link: function (scope, element) {
        $timeout(() => {
          HsCesiumService.init();
        });
      },
    };
  })

  /**
   * @module hs.cesium
   * @name HsCesiumController
   * @ngdoc controller
   * @description
   */
  .controller(
    'HsCesiumController',
    (
      $scope,
      HsCesiumService,
      HsPermalinkUrlService,
      HsCore,
      HsMapService,
      HsSidebarService,
      $timeout,
      $rootScope,
      HsEventBusService
    ) => {
      'ngInject';
      const map = HsCesiumService.map;
      $scope.visible = true;

      /**
       * @ngdoc method
       * @name HsCesiumController#toggleCesiumMap
       * @private
       * @description Toggles between Cesium and OL maps by setting hs_map.visible variable which is monitored by ng-show. ng-show is set on map directive in map.js link function.
       */
      function toggleCesiumMap() {
        HsMapService.visible = !HsMapService.visible;
        $scope.visible = !HsMapService.visible;
        HsPermalinkUrlService.updateCustomParams({
          view: HsMapService.visible ? '2d' : '3d',
        });
        if (HsMapService.visible) {
          HsCesiumService.viewer.destroy();
          $timeout(() => {
            HsCore.updateMapSize();
          }, 5000);
        } else {
          HsCesiumService.init();
        }
        $rootScope.$broadcast(
          'map.mode_changed',
          $scope.visible ? 'cesium' : 'ol'
        );
      }

      const view = HsPermalinkUrlService.getParamValue('view');
      if (view != '2d' || view == '3d') {
        HsPermalinkUrlService.updateCustomParams({view: '3d'});
        setTimeout(() => {
          HsMapService.visible = false;
        }, 0);
      } else {
        HsPermalinkUrlService.updateCustomParams({view: '2d'});
      }

      HsSidebarService.extraButtons.push({
        title: '3D/2D',
        icon_class: 'icon-globealt',
        click: toggleCesiumMap,
      });

      HsEventBusService.layermanagerDimensionChanges.subscribe((data) =>
        HsCesiumService.dimensionChanged(data.layer, data.dimension)
      );

      HsEventBusService.sizeChanges.subscribe((size) =>
        HsCesiumService.resize(size)
      );
      HsCesiumService.resize();

      $scope.$emit('scope_loaded', 'CesiumMap');
    }
  );
